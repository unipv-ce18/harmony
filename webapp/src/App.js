import {Component, Fragment} from 'preact';
import Router from 'preact-router';

import Redirect from './components/Redirect';
import HeaderBar from './header/HeaderBar';
import LoginPage from './components/login/LoginPage';
import HomePage from './components/home/HomePage';
import SearchPage from "./components/search/SearchPage";
import ArtistPage from "./components/artist/ArtistPage";
import MediaPlayerWrapper from './player/components/MediaPlayerWrapper';

import {session, mediaPlayer} from './Harmony';
import styles from './App.scss';

class App extends Component {

  state = {currentPath: null};

  constructor(props) {
    super(props);
    session.addStatusListener(() => {
      console.log('Event logged in:', session.loggedIn);
      this.forceUpdate()
    });
  }

  handleRoute = e => this.setState({currentPath: e.url});

  render(_, {currentPath}) {
    const router = session.loggedIn ? (
      <Router onChange={this.handleRoute}>
        <HomePage path="/"/>
        <SearchPage path="/search/:query"/>
        <ArtistPage path="/artist/:id"/>
        <Redirect default to="/"/>
      </Router>
    ) : (
      <Router onChange={this.handleRoute}>
        <LoginPage path="/login"/>
        <Redirect default to="/login"/>
      </Router>
    );

    return (
      <Fragment>
        <HeaderBar page={currentPath}/>
        <div class={styles.content}>{router}</div>
        {session.loggedIn && <MediaPlayerWrapper playerLoader={mediaPlayer}/>}
      </Fragment>
    );
  }

}

export default App;
