import {Component} from "preact";
import styles from './header.scss';
import {route} from "preact-router";

class LeftBar extends Component {
  constructor(props){
    super(props);
    this.clickHome = this.clickHome.bind(this);
    this.clickLibrary = this.clickLibrary.bind(this);
  }

  clickHome(event) {
    route('/');
    event.preventDefault();
  }

  clickLibrary(event) {
    route('/library/me');
    event.preventDefault();
  }

  render() {
    return (
      <div class={styles.leftBar}>
        <ul>
          <li><a href='#' onClick={this.clickHome}>Home</a></li>
          <li><a href='#' onClick={this.clickLibrary}>Library</a></li>
        </ul>
      </div>
    );
  }
}

export default LeftBar;
