import {h, Component} from 'preact';

import LoginForm from "./LoginForm";
import RegistrationForm from "./RegistrationForm";

import styles from './LoginPage.scss';
import logoImage from "../logo.svg";

class LoginPage extends Component {
  render(_, {registration}) {
    return (
      <div className={styles.loginPage}>
        <img className={styles.logoDiv} src={logoImage} alt=""/>
        {registration ? <RegistrationForm/> : <LoginForm/>}
        <LoginForm/>
      </div>
    );
  }
}

export default LoginPage;
