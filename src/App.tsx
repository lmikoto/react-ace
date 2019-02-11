import React, { Component } from 'react';
import AceEditor from './ace-editor';
import './App.css';

class App extends Component {
  render() {
    const editorProps = {
      showDiff: true,
      autoChange: false,
      height: 400,
      value: 'const a = 1;\nconst b = 2;\n\n\nconst c= 2;'
    }
    return (
      <div className="App">
        <AceEditor {...editorProps} />
      </div>
    );
  }
}

export default App;
