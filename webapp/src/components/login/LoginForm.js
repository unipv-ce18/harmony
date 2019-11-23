import {Component} from 'preact';

import styles from './LoginForm.scss';
import {session} from '../../Harmony';

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

    session.doLogin(e.target.lname.value, e.target.lpsw.value)
      .catch(e => alert('Login failed'));
  }

  render(props) {
    return (
      <div className={styles.loginDiv}>
        <form className={styles.loginForm} onSubmit={this.handleSubmit}>
          <div>
            <div>
              <input type="text" placeholder="Username" name="lname" onChange={this.handleChange}
                     onFocus={this.handleFocus}
                     style={this.state.error.type === "usernameE" ? "border: 1px solid #bf0000" : "border: ''"} autoFocus />
              {this.state.error.type === "usernameE" && (
                <div className={styles.errorField}><span/>{this.state.error.value}</div>)}
            </div>
            <input type="password" placeholder="Password" name="lpsw" onChange={this.handleChange}
                   onFocus={this.handleFocus}
                   style={this.state.error.type === "passE" ? "border: 1px solid #bf0000" : "border: ''"}/>
            {this.state.error.type === "passE" && (
              <div className={styles.errorField}><span/>{this.state.error.value}</div>)}
          </div>
          <div>
            <input type="checkbox"/>
            <label>Remember me</label>
            <input type="submit" value="Login"/>
          </div>
        </form>
        <p className={styles.regLink}>Not yet registered? <a href="#" onClick={props.switchPage}>Sign Up</a> now</p>
      </div>
    );
  }
}

export default LoginForm;
