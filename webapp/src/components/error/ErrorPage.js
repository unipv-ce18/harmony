import {Component} from 'preact';

import styles from './ErrorPage.scss';
import {session} from "../../Harmony";
import {route} from "preact-router";

class ErrorPage extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div class={styles.errorpage}>
        <h1>Error 404 page not found</h1>
        <p>The page you are looking for may not exist or have been removed</p>
        <p>Please try with another page or return to the <a href="/">Home Page</a></p>
      </div>
    );
  }
}

export default ErrorPage;
