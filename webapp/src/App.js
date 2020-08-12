import {Component, Fragment, toChildArray} from 'preact';
import Router, {route} from 'preact-router';
import TransitionGroup from 'preact-transition-group';

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

  #loggedIn = session.loggedIn;

  constructor(props) {
    super(props);
    session.addStatusListener(() => {
      if (session.error) {
        console.log('Error occurred:', session.error);
      }

      if (session.loggedIn !== this.#loggedIn) {
        this.#loggedIn = session.loggedIn;
        this.forceUpdate();  // (necessary) Update the router configuration before switching page
        route(session.loggedIn ? '/' : '/login');  // Route manually to avoid Redirect breaking animations
      }
    });
  }

  handleRoute = e => {
    this.setState({currentPath: e.url});
    session.error = false;
  }

  render(_, {currentPath}) {
    const router = this.#loggedIn ? (
      <TransitionRouter onChange={this.handleRoute}>
        <HomePage key="home" path="/"/>
        <SearchPage key="search" path="/search/:query"/>
        {session.error ? <ErrorPage path="/artist/:id"/> : <ArtistPage key="artist" path="/artist/:id"/>}
        {session.error ? <ErrorPage path="/release/:id"/> : <CollectionPage key="release" path="/release/:id"/>}
        {session.error ? <ErrorPage path="/playlist/:id"/> : <CollectionPage key="playlist" path="/playlist/:id"/>}
        {session.error ? <ErrorPage path="/library/:id"/> : <LibraryPage key="library" path="/library/:id"/>}
        {session.error ? <ErrorPage path="/user/:id"/> : <UserPage key="user" path="/user/:id"/>}
        <Redirect default to="/"/>
      </TransitionRouter>
    ) : (
      <TransitionRouter onChange={this.handleRoute}>
        <LoginPage key="login" registration={false} path="/login"/>
        <LoginPage key="login" registration={true} path="/signup"/>
        <Redirect default to="/login"/>
      </TransitionRouter>
    );

    return (
      <Fragment>
        <HeaderBar page={currentPath}/>
        <div class={styles.content}>{router}</div>
        {this.#loggedIn && <MediaPlayerWrapper playerLoader={mediaPlayer}/>}
      </Fragment>
    );
  }

}

class TransitionRouter extends Router {

  render(props, state) {
    const active = this.getMatchingChildren(toChildArray(props.children), state.url, true);
    const current = active[0] || null;

    return current != null && current.type !== Redirect
      ? (<TransitionGroup>{super.render(props, state)}</TransitionGroup>)
      : super.render(props, state);
  }

}

export default App;
