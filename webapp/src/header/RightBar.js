import {Component} from "preact";
import styles from './header.scss';
import userImage from '../assets/userImage.png';

class RightBar extends Component {
  render() {
    return (
      <div className={styles.userDiv}>
        <img className={styles.userImage} src={userImage}/>
        <span>Username</span>
      </div>
    );
  }
}

export default RightBar;
