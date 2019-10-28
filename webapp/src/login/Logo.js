import {h, Component} from 'preact';
import logo from '../logo.svg';
import styles from "./Logo.scss";

class Logo extends Component {
  render() {
    return (
      <div class={styles.LogoDiv}>
        <img src={logo} alt="logo"/>
      </div>
    );
  }
}

export default Logo;
