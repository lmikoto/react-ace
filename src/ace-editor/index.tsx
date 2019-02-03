import React, { Component, Fragment } from 'react';
import { isEqual, forEach } from 'lodash';
import ace from "ace-builds";
import * as Diff from 'diff';
import './index.css';
import { render } from 'react-dom';

interface Props{
  value?: string;
  onEvents?: {[event: string]:Function};
  autoChange?: boolean;
  options?: object;
  width?:string | number;
  height?:string | number;
  style?: object;
  selectionRange?: object;
  placeholder?:string;
  showDiff?:boolean;
}

interface DiffInfo{
   added?: boolean;
   removed?: boolean;
   value?:string;
}

interface State{
  isDiff:boolean;
  diffInfo: DiffInfo[];
}

class AceEditor extends Component<Props,State> {

  static defaultProps = {
    width: '100%',
    height: 800,
    autoChange: true,
    value: '',
    showDiff: false,
  }

  state = {
    isDiff: false,
    diffInfo: [],
  }
  private refEditor: any;

  private editor: any;

  private oldValue: any;

  componentWillUnmount() {
    this.editor.destroy();
    this.editor = null;
  }

  componentDidMount() {
    console.log(Diff);
    this.configEditor();
  }

  componentWillReceiveProps(nextProps:Props) {
    if (!this.editor) {
      return;
    }

    const { options: nextOpt, value, selectionRange: nextSelectRange } = nextProps;
    const { options, selectionRange } = this.props;

    if (!isEqual(nextOpt, options)) {
      this.editor.setOptions(nextOpt);
    }
    if (this.editor && this.editor.getValue() !== value) {
      this.editor.setValue(value);
    }

    if (!isEqual(selectionRange, nextSelectRange)) {
      this.editor.selection.setSelectionRange(nextSelectRange);
    }
  }

  configEditor = async () => {
    const {
      value,
      onEvents = {},
      options = {},
      selectionRange,
    } = this.props;

    this.editor =  ace.edit(this.refEditor, options);
    this.editor.setValue(value);
    this.oldValue = value;

    if (selectionRange) {
      this.editor.selection.setSelectionRange(selectionRange);
    }

    this.showPlaceholder();

    // set event
    this.bindEvents(onEvents);
  }

  onChange = (event?:any) => {
    const {
      autoChange = true,
    } = this.props;

    if (autoChange) {
      this.manulChange(event);
    }
  }

  showPlaceholder = () => {
    // deal placeholder
    const shouldShow = !this.editor.getValue().length;
    const { renderer } = this.editor;
    let node = renderer.emptyMessageNode;
    if (!shouldShow && node) {
      renderer.scroller.removeChild(node);
      renderer.emptyMessageNode = null;
    } else if (shouldShow && !node) {
      const { placeholder } = this.props;
      node = document.createElement('div');
      node.textContent = placeholder;
      node.className = 'ace_invisible ace_emptyMessage';
      node.style.padding = '0 9px';
      renderer.emptyMessageNode = node;
      renderer.scroller.appendChild(node);
    }
  }

  manulChange = (event?:any) => {
    const { onEvents = {} } = this.props;
    const { change } = onEvents;
    if(change){
      change(this.editor.getValue(), event);
    }else{
      console.error('you should set onchange event')
    }
  }

  handleDiff = () => {
    const { isDiff } = this.state;
    const diffInfo = Diff.diffLines(this.oldValue, this.editor.getValue());
    this.setState({isDiff: !isDiff,diffInfo})
  }

  renderDiff = () => {
    const { isDiff,diffInfo }:State = this.state;
    const renderNode = [];
    for (var i=0; i < diffInfo.length; i++) {
      if (diffInfo[i].added && diffInfo[i + 1] && diffInfo[i + 1].removed) {
        let swap = diffInfo[i];
        diffInfo[i] = diffInfo[i + 1];
        diffInfo[i + 1] = swap;
      }
      if (diffInfo[i].removed) {
        renderNode.push(<del key={i}>{diffInfo[i].value}</del>);
      } else if (diffInfo[i].added) {
        renderNode.push(<ins key={i}>{diffInfo[i].value}</ins>);
      } else {
        renderNode.push(<Fragment key={i}>{diffInfo[i].value}</Fragment>);
      }
    }
    return <pre>{renderNode}</pre>;
  }

  bindEvents = (onEvents:any) => {
    let events = onEvents;
    if (onEvents.change) {
      events = { ...onEvents, change: this.onChange };
    }
    events = { ...event, input: this.showPlaceholder };

    forEach(events, (func, eventName) => {
      if (typeof eventName === 'string' && typeof func === 'function') {
        this.editor.on(eventName, (param:any) => {
          func(param, this.editor);
        });
      }
    });
  };

  render() {
    const { style = {}, width, height, autoChange,showDiff } = this.props;
    const { isDiff } = this.state;
    const editorStyle = {  ...style, width, height,display: isDiff? 'none':'block' };
    const diffStyle = {  ...style, width, height,display: !isDiff? 'none':'block' };
    return (
      <div>
       <div ref={(ref) => { this.refEditor = ref; }} style={editorStyle} />
       <div className="editor-diff" style={diffStyle}>{this.renderDiff()}</div>
       <div className="editor-operate">
          { !autoChange && <a onClick={this.manulChange}>保存</a>}
          { showDiff && <a onClick={this.handleDiff}>{ !isDiff ? '对比' : '取消对比'}</a>}
       </div>
      </div>
    );
  }
}

export default AceEditor;

