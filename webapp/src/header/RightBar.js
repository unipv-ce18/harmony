import {h, Component} from "preact";
import styles from './header.scss';
import userImage from './userImage.png';

class RightBar extends Component {
  render() {
    return (
      <div className={styles.userDiv}>
        <img className={styles.userImage} src={userImage}/>
        <p>Username</p>
      </div>
    );
  }
}

export default RightBar;
