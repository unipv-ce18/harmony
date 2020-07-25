import {Component} from 'preact';

import HarmonyLogo from '../HarmonyLogo';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter'

import styles from './LoginPage.scss';

class LoginPage extends Component {

  state = {registration: false};

  render({registration}) {
    return (
      <div class={styles.loginPage}>
        <HarmonyLogo color="#ddd" class={styles.logoDiv} animate/>
        <LoginForm registration={registration}/>
        <LoginFooter/>
      </div>
    );
  }
}

export default LoginPage;
