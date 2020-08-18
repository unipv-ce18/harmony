import HarmonyPage from '../HarmonyPage';
import HarmonyLogo from '../HarmonyLogo';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter'

import styles from './LoginPage.scss';

class LoginPage extends HarmonyPage {

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
