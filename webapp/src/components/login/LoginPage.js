import {Component} from 'preact';

import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter'

import styles from './LoginPage.scss';
import logoImage from "!file-loader!../../assets/logo.svg";

class LoginPage extends Component {

  state = {registration: false};

  render({registration}) {
    return (
      <div class={styles.loginPage}>
        <img class={styles.logoDiv} src={logoImage} alt=""/>
        <LoginForm registration={registration}/>
        <LoginFooter/>
      </div>
    );
  }
}

export default LoginPage;
