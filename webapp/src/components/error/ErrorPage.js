import {Component} from 'preact';
import {route} from "preact-router";

import {session} from "../../Harmony";

import styles from './ErrorPage.scss';

class ErrorPage extends Component {
  constructor(props) {
    super(props);

    this.clickHome = this.clickHome.bind(this);
  }

  clickHome(e) {
    e.preventDefault();
    session.error = false;
    route('/');
  }

  render() {
    return (
      <div class={styles.errorpage}>
        <h1>Error 404 page not found</h1>
        <p>The page you are looking for may not exist or have been removed</p>
        <p>Please try with another page or return to the <a href='#' onClick={this.clickHome}>Home</a></p>
      </div>
    );
  }
}

export default ErrorPage;
