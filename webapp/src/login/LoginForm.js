import {h, Component} from 'preact';

import styles from './LoginPage.scss';

class LoginForm extends Component {
  render() {
    return (
      <div>
        <form class={styles.loginForm}>
          <input type="text" placeholder="Username" name="uname" required/>
          <hr/>
          <input type="password" placeholder="Password" name="psw" required/>
          <hr/>
          <label className={styles.rememberMe}><input type="checkbox" name="remember"/>Remember me</label>
          <button type="submit">Login</button>
          <p className={styles.regisLink}>Not yet registered? <a href="#">SIGN UP</a> now</p>
        </form>
        <div className={styles.loginFooter}>
          <p>The Onion Foundation</p>
          <p>Free and Open Source Software</p>
        </div>
      </div>
    );
  }
}

export default LoginForm;
