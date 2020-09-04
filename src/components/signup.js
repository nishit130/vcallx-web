import React, { Component } from "react";
import { Button, Form, FormGroup, Label, Input, Fade } from "reactstrap";
import _ from "lodash";
import "../signup.css";

const validationMethods = {
  required: (field, value) => {
    if (!value.toString().trim().length) {
      return `This ${field} field is required.`;
    }
  },
  isEmail: (field, value) => {},
};

const validateForm = (form) => {
  const loginForm = document.getElementById(form);
  return loginForm.querySelectorAll("[validations]");
};

const runValidationRules = (element, errors) => {
  const target = element;
  const field = target.name;
  const value = target.value;
  let validations = element.getAttribute("validations");
  validations = validations.split(",");

  for (let validation of validations) {
    validation = validation.split(":");
    const rule = validation[0];
    const error = validationMethods[rule](field, value);
    errors[field] = errors[field] || {};
    if (error) {
      errors[field][rule] = error;
    } else {
      if (_.isEmpty(errors[field])) {
        delete errors[field];
      } else {
        delete errors[field][rule];
      }
    }
  }

  return errors;
};

export default class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      errors: [],
    };
  }

  componentDidMount() {
    this.props.socket.on("check-user", (value) => {
      if (value) {
        this.props.socket.emit("addUser", {
          socketID: this.props.socket.id,
          username: this.state.email,
          password: this.state.password,
        });
        this.props.onLogin(false);
      } else {
        alert("user with that username already exist!");
      }
    });
  }

  handleChange = (event) => {
    const target = event.target;
    const field = target.name;
    const value = target.value;

    const errors = runValidationRules(target, this.state.errors);

    this.setState({
      errors: errors,
    });

    this.setState({
      [field]: value,
    });
  };

  signup = (event) => {
    event.preventDefault();

    const formElements = validateForm("loginForm");

    formElements.forEach((element) => {
      const errors = runValidationRules(element, this.state.errors);
      this.setState({
        errors: errors,
      });
    });

    const email = this.state.email;
    const password = this.state.password;
    const errors = this.state.errors;
    console.log(email, password, errors);
    this.props.socket.emit("check-user", {
      socketID: this.props.socket.id,
      username: email,
      password: password,
    });
  };
  render() {
    return (
      <div className='container page'>
        <h2 className='heading'>Signup</h2>
        <Form id='loginForm' method='post' onSubmit={this.signup}>
          <FormGroup>
            <Input
              type='text'
              className='inputArea'
              validations={["required", "isEmail"]}
              name='email'
              value={this.state.email}
              onChange={this.handleChange}
              id='email'
              placeholder='Enter your email address.'
            />
            <FromValidationError field={this.state.errors.email} />
          </FormGroup>
          <FormGroup>
            <Input
              type='password'
              validations={["required"]}
              className='inputArea'
              name='password'
              value={this.state.password}
              onChange={this.handleChange}
              id='password'
              placeholder='Enter your password.'
            />
            <FromValidationError field={this.state.errors.password} />
          </FormGroup>
          <Button>signup</Button>
        </Form>
        <p style={{ color: "white" }} onClick={this.props.login}>
          Already have an Account?
        </p>
      </div>
    );
  }
}

const FromValidationError = (props) => (
  <Fade in={Boolean(props.field)} tag='p' className='error'>
    {props.field ? Object.values(props.field).shift() : ""}
  </Fade>
);
