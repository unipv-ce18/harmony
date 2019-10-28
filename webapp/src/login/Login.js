import {h, Component} from 'preact';

import styles from './Login.scss';

class Login extends Component {
  render() {
    return (
      <div>
        <div class={styles.loginDiv}>
          <form class={styles.loginForm}>
            <input type="text" placeholder="Username" name="uname" required/>
            <hr/>
            <input type="password" placeholder="Password" name="psw" required/>
            <hr/>
            <label class={styles.rememberMe}><input type="checkbox" name="remember"/>Remember me</label>
            <button type="submit">Login</button>
          </form>
        </div>
        <p class={styles.loginFooter}>The Onion Foundation<br/>Free and Open Source Software</p>
      </div>
    );
  }
}

export default Login;
