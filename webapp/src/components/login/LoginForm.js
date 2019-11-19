import {Component} from 'preact';

import styles from './LoginForm.scss';
import {session} from '../../Harmony';

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lname: "",
      lpsw: "",
      error: {type: "", value: ""}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  unameValidation() {
    if (this.state.lname === "") {
      this.setState({error: {type: "usernameE", value: "This field cannot be empty"}});
      return false;
    }
    return true;
  }

  passwordValidation() {
    if (this.state.lpsw === "") {
      this.setState({error: {type: "passE", value: "This field cannot be empty"}});
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
    if (!this.unameValidation()) return false;
    else return this.passwordValidation();
  }
    /*
    e.preventDefault();
    session.doLogin(e.target.user.value, e.target.pass.value)
      .catch(e => alert('Login failed'));

     */


  render(props) {
    return (
      <div class={styles.loginDiv}>
        <form class={styles.loginForm} onSubmit={this.handleSubmit}>
          <div>
            <input type="text" placeholder="Username" name="lname" onChange={this.handleChange}
                   onFocus={this.handleFocus} autoFocus/>
            {this.state.error.type === "usernameE" && (<div>{this.state.error.value}</div>)}
            <input type="password" placeholder="Password" name="lpsw" onChange={this.handleChange}
                   onFocus={this.handleFocus}/>
            {this.state.error.type === "passE" && (<div>{this.state.error.value}</div>)}
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
