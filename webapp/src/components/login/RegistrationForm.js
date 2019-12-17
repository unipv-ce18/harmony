import {Component} from 'preact';

import {execRegistration} from '../../core/apiCalls';
import {session} from "../../Harmony";

import style from './formsCommon.scss';
import styleRegistration from './RegistrationForm.scss';

class RegistrationForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      remail: "",
      rname: "",
      rpsw1: "",
      rpsw2: "",
      error: {type: "", value: ""}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }


  emailValidation() {
    const validator = /^[a-zA-Z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (this.state.remail === "") {
      this.setState({error: {type: "emailE", value: "This field cannot be empty."}});
      return false;
    } else if (!this.state.remail.match(validator)) {
      this.setState({error: {type: "emailE", value: "Email not valid."}});
      return false;
    }
    return true;
  }

  unameValidation() {
    const validator = /^[a-zA-Z1-9]{1,15}$/;
    if (this.state.rname === "") {
      this.setState({error: {type: "usernameE", value: "This field cannot be empty."}});
      return false;
    } else {
      if (!this.state.rname.match(validator)) {
        this.setState({error: {type: "usernameE", value: "This field contains invalid characters."}});
        return false;
      }
    }
    return true;
  }

  password1Validation() {
    const validator = /^[a-zA-Z0-9!$%@]{5,25}$/;
    if (this.state.rpsw1 === "") {
      this.setState({error: {type: "pass1E", value: "This field cannot be empty."}});
      return false;
    } else {
      if (!this.state.rpsw1.match(validator)) {
        this.setState({error: {type: "pass1E", value: "This field contains invalid characters."}});
        return false;
      }
    }
    return true;
  }

  password2Validation() {
    if (this.state.rpsw2 === "") {
      this.setState({error: {type: "pass2E", value: "This field cannot be empty."}});
      return false;
    } else {
      if (this.state.rpsw1 !== this.state.rpsw2) {
        this.setState({error: {type: "pass2E", value: "Passwords don't match."}});
        return false;
      }
    }
    return true;
  }


  handleChange(e) {
    this.setState({[e.target.name]: e.target.value})
  }

  handleFocus() {
    this.setState({error: {type: "", value: ""}})
  }

  handleSubmit(e) {
    e.preventDefault();
    if (!this.emailValidation() || !this.unameValidation() ||
      !this.password1Validation() || !this.password2Validation())
      return false;
    (execRegistration(this.state.remail, this.state.rname, this.state.rpsw1)
        .then(value => {
          if (value === 200) {
            session.doLogin(this.state.rname, this.state.rpsw1);
          } else {
            this.setState(value);
          }
        })
    );
  }

  render(props) {
    const errorStyle = `border: 1px solid #bf0000`;
    return (
      <div class={style.formWrapper}>
        <form class={`${style.form} ${styleRegistration.regisForm}`} onSubmit={this.handleSubmit}>
          <div>
            <input type="text" placeholder="Email" name="remail" onChange={this.handleChange}
                   onFocus={this.handleFocus}
                   style={this.state.error.type === "emailE" && errorStyle}/>
            {this.state.error.type === "emailE" && (
              <div class={style.errorField}><span/>{this.state.error.value}</div>)}
            <input type="text" placeholder="Username" name="rname" onChange={this.handleChange}
                   onFocus={this.handleFocus}
                   style={this.state.error.type === "usernameE" && errorStyle}/>
            {this.state.error.type === "usernameE" && (
              <div class={style.errorField}><span/>{this.state.error.value}</div>)}
            <input type="password" placeholder="Password" name="rpsw1" onChange={this.handleChange}
                   onFocus={this.handleFocus}
                   style={this.state.error.type === "pass1E" && errorStyle}/>
            {this.state.error.type === "pass1E" && (
              <div class={style.errorField}><span/>{this.state.error.value}</div>)}
            <input type="password" placeholder="Repeat Password" name="rpsw2" onChange={this.handleChange}
                   onFocus={this.handleFocus}
                   style={this.state.error.type === "pass2E" && errorStyle}/>
            {this.state.error.type === "pass2E" && (
              <div class={style.errorField}><span/>{this.state.error.value}</div>)}
          </div>
          <div>
            <input type="submit" value="Sign Up"/>
          </div>
        </form>
        <p class={style.regLink}>Are you already registered? <a href="#" onClick={props.switchPage}>Login</a> now
        </p>
      </div>
    );
  }
}

export default RegistrationForm;
