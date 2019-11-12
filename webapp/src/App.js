import {Component, Fragment} from 'preact';
import Router from 'preact-router';
import Match from 'preact-router/match';

import Redirect from './components/Redirect';
import HeaderBar from './header/HeaderBar';
import LoginPage from './components/login/LoginPage';
import HomePage from './components/home/HomePage';
import SearchPage from "./components/search/SearchPage";
import MediaPlayerWrapper from './player/components/MediaPlayerWrapper';

import {session, mediaPlayer} from './Harmony';
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
        <SearchPage path="/search/:query"/>
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
        <Match>{({path}) => (<HeaderBar page={path}/>)}</Match>
        <div class={styles.content}>{router}</div>
        {session.loggedIn && <MediaPlayerWrapper playerLoader={mediaPlayer}/>}
      </Fragment>
    );
  }

}

export default App;
