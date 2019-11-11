import {h, Component} from "preact";
import styles from './header.scss';
import LeftBar from "./LeftBar";
import MiddleBar from "./MiddleBar";
import RightBar from "./RightBar";

class HeaderBar extends Component {
  render(props, state) {
    return (
      <header>
        <LeftBar />
        <MiddleBar page = {this.props.page}/>
        <RightBar />
      </header>
    );
  }
}

export default HeaderBar;
