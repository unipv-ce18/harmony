import {Component} from 'preact';

import {session, catalog} from '../../Harmony';

import style from './formsCommon.scss';
import styleLogin from './LoginForm.scss';
import {route} from "preact-router";

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lname: "",
      lpsw: "",
      bgColor: "",
      error: {type: "", value: ""}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  unameValidation() {
    if (this.state.lname === "") {
      this.setState({error: {type: "usernameE", value: "This field cannot be empty."}});
      this.setState({bgColor: "red"});
      return false;
    }
    return true;
  }

  passwordValidation() {
    if (this.state.lpsw === "") {
      this.setState({error: {type: "passE", value: "This field cannot be empty."}});
      return false;
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
    if (!this.unameValidation() || !this.passwordValidation())
      return false;

    session.doLogin(this.state.lname, this.state.lpsw)
      .catch(e => alert('Login failed'));
  }

  render(props) {
    const errorStyle = `border: 1px solid #bf0000`;
    return (
      <div class={style.formWrapper}>
        <form class={`${style.form} ${styleLogin.loginForm}`} onSubmit={this.handleSubmit}>
          <div>
            <div>
              <input type="text" placeholder="Username" name="lname" onChange={this.handleChange}
                     onFocus={this.handleFocus}
                     style={this.state.error.type === "usernameE" && errorStyle} autoFocus />
              {this.state.error.type === "usernameE" && (
                <div class={style.errorField}><span/>{this.state.error.value}</div>)}
            </div>
            <input type="password" placeholder="Password" name="lpsw" onChange={this.handleChange}
                   onFocus={this.handleFocus}
                   style={this.state.error.type === "passE" && errorStyle}/>
            {this.state.error.type === "passE" && (
              <div class={style.errorField}><span/>{this.state.error.value}</div>)}
          </div>
          <div>
            <input type="checkbox"/>
            <label>Remember me</label>
            <input type="submit" value="Login"/>
          </div>
        </form>
        <p class={style.regLink}>Not yet registered? <a href="#" onClick={props.switchPage}>Sign Up</a> now</p>
      </div>
    );
  }
}

export default LoginForm;
