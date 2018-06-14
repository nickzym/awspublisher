import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Form, FormGroup, Col, FormControl, ControlLabel, HelpBlock, Button } from 'react-bootstrap';
import { RemoteObject } from './util.js'
const api = RemoteObject('http://localhost:6051')

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.handleChangeTopic = this.handleChangeTopic.bind(this);
    this.handleChangeKey = this.handleChangeKey.bind(this);
    this.handleChangeValue = this.handleChangeValue.bind(this);
    this.publishSNS = this.publishSNS.bind(this);

    this.state = {
      snsTopic: '',
      snsKey: '',
      snsValue: ''
    };
  }

  handleChangeKey(e) {
    this.setState({
      snsKey: e.target.value
    })
  }

  handleChangeValue(e) {
    this.setState({
      snsValue: e.target.value
    })
  }

  handleChangeTopic(e) {
    this.setState({
      snsTopic: e.target.value
    })
  }

  publishSNS() {
    console.log(this.state)
    api.test_publisher(this.state.snsTopic, this.state.snsKey, this.state.snsValue)
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to Lambda SNS publisher</h1>
        </header>
        <br />
        <br />
        <div className="container">
          <FormControl
            type="text"
            placeholder="Enter sns topic"
            onChange={this.handleChangeTopic}
          />
          <br />
          <FormControl
            type="text"
            placeholder="Enter sns key"
            onChange={this.handleChangeKey}
          />
          <br />
          <FormControl
            type="text"
            placeholder="Enter sns value"
            onChange={this.handleChangeValue}
          />
          <br />
          <Button bsStyle="primary" onClick={this.publishSNS}>Publish!!!</Button>
        </div>
      </div>
    );
  }
}

export default App;
