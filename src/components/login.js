import React, { Component } from "react";
// import { Button, Form, FormGroup, Label, Input, Fade } from "reactstrap";
import _ from "lodash";
import Signup from "./signup";
import "../login.css";

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      errors: [],
      Signup: false,
    };
  }

  componentDidMount() {
    this.props.socket.on("login-user", (message, value) => {
      if (value) {
        this.props.onLogin(false);
      } else {
        alert(message);
        // this.props.socket.emit('addUser', {socketID:this.props.socket.id,username: email, password: password});
      }
    });
  }
  submit = () => {
    const email = this.state.email;
    const password = this.state.password;
    const errors = this.state.errors;
    console.log(email, password, errors);
    //console.log(this.props)
    this.props.socket.emit("login-user", {
      socketID: this.props.socket.id,
      username: email,
      password: password,
    });
  };

  handleChange = (event) => {
    const target = event.target;
    const field = target.name;
    const value = target.value;

    this.setState({
      [field]: value,
    });
  };
  login = () => {
    this.setState({
      Signup: false,
    });
  };
  Signup = () => {
    this.setState({
      Signup: true,
    });
  };
  render() {
    if (this.state.Signup) {
      return (
        <Signup
          login={this.login}
          onLogin={this.props.onLogin}
          socket={this.props.socket}
        />
      );
    } else {
      return (
        <div className='page'>
          <h2 className='heading'>Login</h2>
          <div id='loginForm'>
            <div>
              <input
                type='text'
                name='email'
                value={this.state.email}
                onChange={this.handleChange}
                id='email'
                className='inputArea'
                placeholder='Enter your email address.'
              />
            </div>
            <div>
              <input
                type='password'
                name='password'
                value={this.state.password}
                onChange={this.handleChange}
                id='password'
                className='inputArea'
                placeholder='Enter your password.'
              />
            </div>
          </div>
          <div class='button-div'>
            <button onClick={this.submit} className='btn'>
              login
            </button>
          </div>
          <p style={{ color: "white" }} onClick={this.Signup}>
            Create account?
          </p>
        </div>
      );
    }
  }
}
