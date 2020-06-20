import {Component} from 'preact';

import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import LoginFooter from './LoginFooter'

import styles from './LoginPage.scss';
import logoImage from "!file-loader!../../assets/logo.svg";

class LoginPage extends Component {

  state = {registration: false};

  switchPage = () => this.setState({registration : !this.state.registration});

  render(_, {registration}) {
    return (
      <div class={styles.loginPage}>
        <img class={styles.logoDiv} src={logoImage} alt=""/>
        {registration ? <RegistrationForm switchPage={this.switchPage} /> : <LoginForm switchPage={this.switchPage} />}
        <LoginFooter/>
      </div>
    );
  }
}

export default LoginPage;
