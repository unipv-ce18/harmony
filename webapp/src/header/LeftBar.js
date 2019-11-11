import {h, Component} from "preact";
import styles from './header.scss';

class LeftBar extends Component {
  render() {
    return (
      <div>
        <ul>
          <li>Home</li>
          {/*<li><a href='./'></a>Home</li>*/}
          <li></li>
        </ul>
      </div>
    );
  }
}

export default LeftBar;
