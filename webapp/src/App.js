import {Component, Fragment} from 'preact';
import Router from 'preact-router';

import Redirect from './components/Redirect';
import Navbar from './components/Navbar';
import LoginPage from './components/login/LoginPage';
import HomePage from './components/home/HomePage';

import {Session} from './core/Session';
import styles from './App.scss';

export const sessionInstance = new Session();

class App extends Component {

  constructor(props) {
    super(props);
    sessionInstance.addStatusListener(() => {
      console.log('Event logged in:', sessionInstance.loggedIn);
      this.forceUpdate()
    });
  }

  render() {
    const router = sessionInstance.loggedIn ? (
      <Router>
        <HomePage path="/"/>
        <Redirect default to="/"/>
      </Router>
    ) : (
      <Router>
        <LoginPage path="/login"/>
        <Redirect default to="/login"/>
      </Router>
    );

    return (
      <Fragment>
        <Navbar/>
        <div class={styles.content}>{router}</div>
      </Fragment>
    );
  }

}

export default App;
