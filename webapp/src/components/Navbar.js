import {Component} from 'preact';

import styles from './Navbar.scss';

class Navbar extends Component {

  render() {
    return <div class={styles.navbar}>I am a fancy navbar</div>;
  }

}

export default Navbar;
