import {Component, Fragment} from 'preact';
import Router from 'preact-router';

import Redirect from './components/Redirect';
import HeaderBar from './header/HeaderBar';
import LoginPage from './components/login/LoginPage';
import HomePage from './components/home/HomePage';
import SearchPage from "./components/search/SearchPage";
import ArtistPage from "./components/artist/ArtistPage";
import CollectionPage from "./components/collection/CollectionPage";
import LibraryPage from "./components/library/LibraryPage";
import ErrorPage from "./components/error/ErrorPage";
import MediaPlayerWrapper from './player/components/MediaPlayerWrapper';
import UserPage from "./components/user/UserPage";

import {session, mediaPlayer} from './Harmony';
import styles from './App.scss';

class App extends Component {

  state = {currentPath: null};

  constructor(props) {
    super(props);
    session.addStatusListener(() => {
      console.log('Event logged in:', session.loggedIn);
      this.forceUpdate();
    });
    session.addStatusListener(() => {
      console.log('Error occured:', session.error);
    });
  }

  handleRoute = e => {
    this.setState({currentPath: e.url});
    session.error = false;
  }

  render(_, {currentPath}) {
    const router = session.loggedIn ? (
      <Router onChange={this.handleRoute}>
        <HomePage path="/"/>
        <SearchPage path="/search/:type/:query"/>
        {session.error ? <ErrorPage path="/artist/:id"/> : <ArtistPage path="/artist/:id"/>}
        {session.error ? <ErrorPage path="/release/:id"/> : <CollectionPage path="/release/:id"/>}
        {session.error ? <ErrorPage path="/playlist/:id"/> : <CollectionPage path="/playlist/:id"/>}
        {session.error ? <ErrorPage path="/library/:id"/> : <LibraryPage path="/library/:id"/>}
        {session.error ? <ErrorPage path="/user/:id"/> : <UserPage path="/user/:id"/>}
        <Redirect default to="/"/>
      </Router>
    ) : (
      <Router onChange={this.handleRoute}>
        <LoginPage key="login" registration={false} path="/login"/>
        <LoginPage key="login" registration={true} path="/signup"/>
        <Redirect default to="/login"/>
      </Router>
    );

    return (
      <Fragment>
        <HeaderBar page={currentPath}/>
        <div class={styles.content}>{
          router
        }</div>
        {session.loggedIn && <MediaPlayerWrapper playerLoader={mediaPlayer}/>}
      </Fragment>
    );
  }

}

export default App;
