import {Component, Fragment} from 'preact';
import Router from 'preact-router';

import Redirect from './components/Redirect';
import Navbar from './components/Navbar';
import LoginPage from './components/login/LoginPage';
import HomePage from './components/home/HomePage';

import {session} from './Harmony';
import styles from './App.scss';

class App extends Component {

  constructor(props) {
    super(props);
    session.addStatusListener(() => {
      console.log('Event logged in:', session.loggedIn);
      this.forceUpdate()
    });
  }

  render() {
    const router = session.loggedIn ? (
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
