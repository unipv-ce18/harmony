import {h, Component} from 'preact';

import styles from './LoginForm.scss';

class LoginForm extends Component {
  render() {
    return (
      <form className={styles.loginForm}>
        <div>
          <input type="text" placeholder="Username" name="uname" required/>
          <input type="password" placeholder="Password" name="psw" required/>
        </div>
        <div>
          <label className={styles.rememberMe}><input type="checkbox" name="remember"/>Remember me</label>
          <button type="submit">Login</button>
        </div>
        <p className={styles.regisLink}>Not yet registered? <a href="#">SIGN UP</a> now</p>
      </form>
    );
  }
}

export default LoginForm;
