import {Component} from 'preact';

import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import LoginFooter from './LoginFooter'

import styles from './LoginPage.scss';
import logoImage from "../../assets/logo.svg";

class LoginPage extends Component {
  render(_, {registration}) {
    return (
      <div class={styles.loginPage}>
        <img class={styles.logoDiv} src={logoImage} alt=""/>
        {registration ? <RegistrationForm/> : <LoginForm/>}
        <LoginFooter/>
      </div>
    );
  }
}

export default LoginPage;
