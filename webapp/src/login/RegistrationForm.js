import {h, Component} from 'preact';

import styles from './LoginPage.scss';

class RegistrationForm extends Component {
  render() {
    return (
      <div>
        <form class={styles.loginForm}>
          <input type="text" placeholder="Email" name="uemail" required/>
          <input type="text" placeholder="Username" name="uname" required/>
          <input type="password" placeholder="Password" name="upsw1" required/>
          <input type="password" placeholder="Repeat Password" name="upsw2" required/>
          <hr/>
          <button type="submit">Signup</button>
          <p className={styles.regisLink}>Already registered? <a href="#">LOG IN</a> now</p>
        </form>
        <p class={styles.loginFooter}>The Onion Foundation<br/>Free and Open Source Software</p>
      </div>
    );
  }
}

export default RegistrationForm;
