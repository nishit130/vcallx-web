import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input, Fade  } from 'reactstrap';
import _ from 'lodash';
 
const validationMethods =  {
    required : (field, value) => {
        if (!value.toString().trim().length) {
            return  `This ${field} field is required.`
        }
    },
    isEmail: (field,value) => {
               
    }
} 
 
const validateForm = (form) => {
    const loginForm = document.getElementById(form)
     return loginForm.querySelectorAll('[validations]');
}
 
const runValidationRules  = (element, errors) => {
    const target = element;
    const field =  target.name;
    const value = target.value
    let validations =  element.getAttribute('validations');
    validations =  validations.split(',')
 
    for (let validation of validations) {
        validation = validation.split(':');
        const rule = validation[0];
        const error = validationMethods[rule](field, value);
        errors[field] = errors[field] || {};
        if(error) {
            errors[field][rule] = error;
        } else {
            if(_.isEmpty(errors[field])) {
                delete errors[field];
            } else {
                delete errors[field][rule];
            }
        }
    }
 
    return errors;
}
 
 
export default class Login extends Component {
 
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            errors: []
        }
    }
 
 
 
    login = (event) => {
 
        event.preventDefault();
 
        const formElements = validateForm("loginForm");
 
        formElements.forEach(element=> {
           const errors = runValidationRules(element, this.state.errors);
            this.setState({
                errors: errors
            });
        })
 
        const email = this.state.email;
        const password = this.state.password;
        const errors =  this.state.errors;
        console.log(email, password, errors);
        console.log(this.props)
        this.props.socket.emit('addUser', {socketID:this.props.socket.id,username: email, password: password});
    }
 
    handleChange = (event) => {
        const target = event.target;
        const field =  target.name;
        const value = target.value
 
        const errors = runValidationRules(target, this.state.errors);
 
        this.setState({
            errors: errors
        });
 
        this.setState({
            [field]:  value
        });
    }
 
    render() {
        return (
            <div className="container">
                <Form id="loginForm" method="post" onSubmit={this.login}>
                    <FormGroup>
                        <Label for="email">Email</Label>
                        <Input
                            type="text"
                            validations={['required','isEmail']}
                            name="email"
                            value={this.state.email}
                            onChange={this.handleChange}
                            id="email"
                            placeholder="Enter your email address."
                        />
                      <FromValidationError field={this.state.errors.email} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="password">Password</Label>
                        <Input
                            type="password"
                            validations={['required']}
                            name="password"
                            value={this.state.password}
                            onChange={this.handleChange}
                            id="password"
                            placeholder="Enter your password."
                        />
                        <FromValidationError field={this.state.errors.password} />
                    </FormGroup>
                    <Button>login</Button>
                </Form>
            </div>
        );
    }
}
 
const FromValidationError = props => (
    <Fade in={Boolean(props.field)}  tag="p" className="error">
       { props.field ?  Object.values(props.field).shift() : '' } 
  </Fade>
);