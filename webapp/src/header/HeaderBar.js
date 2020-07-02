import {Component} from "preact";
import styles from './header.scss';
import LeftBar from "./LeftBar";
import MiddleBar from "./MiddleBar";
import RightBar from "./RightBar";

class HeaderBar extends Component {
  render({page}, state) {
    // No header in login page
    if (page === '/login' || page === '/signup') return null;

    return (
      <header>
        <LeftBar />
        <MiddleBar page={page}/>
        <RightBar />
      </header>
    );
  }
}

export default HeaderBar;
