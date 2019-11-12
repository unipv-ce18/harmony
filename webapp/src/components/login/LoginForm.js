import {Component} from 'preact';

import styles from './LoginForm.scss';
import {session} from '../../Harmony';

class LoginForm extends Component {

  onSubmit(e) {
    e.preventDefault();
    session.doLogin(e.target.user.value, e.target.pass.value)
      .catch(e => alert('Login failed'));
  }

  render() {
    return (
      <div class={styles.loginDiv}>
        <form class={styles.loginForm} onSubmit={this.onSubmit}>
          <div>
            <input id="user" type="text" placeholder="Username" required autoFocus/>
            <input id="pass" type="password" placeholder="Password" required/>
          </div>
          <div>
            <input type="checkbox" id="rem"/>
            <label id="rem">Remember me</label>
            <input type="submit" value="Login"/>
          </div>
        </form>
        <p className={styles.regLink}>Not yet registered? <a href="#">Sign Up</a> now</p>
      </div>
    );
  }
}

export default LoginForm;
