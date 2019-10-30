import {Component} from 'preact';

import styles from './LoginForm.scss';

class LoginForm extends Component {
  render() {
    return (
      <div class={styles.loginDiv}>
        <form class={styles.loginForm}>
          <div>
            <input type="text" placeholder="Username" required autoFocus/>
            <input type="password" placeholder="Password" required/>
          </div>
          <div>
            <input type="checkbox" id="rem"/>
            <label id="rem">Remember me</label>
            <input type="submit" value="Login"/>
          </div>
        </form>
        <p className={styles.regLink}>Not yet registered? <a href="#">Sign Up</a> now</p>
      </div>
    )
  }
}

export default LoginForm;
