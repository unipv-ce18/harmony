import HarmonyPage from '../HarmonyPage';
import Themeable from '../Themeable';
import HarmonyLogo from '../HarmonyLogo';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter'

import styles from './LoginPage.scss';

class LoginPage extends HarmonyPage {

  render({registration}) {
    return (
      <div class={styles.loginPage}>
        <Themeable propVariables={{color: '--th-logo-color'}}>
          <HarmonyLogo class={styles.logoDiv} animate/>
        </Themeable>
        <LoginForm registration={registration}/>
        <LoginFooter/>
      </div>
    );
  }

}

export default LoginPage;
