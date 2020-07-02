import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {catalog, session} from '../../Harmony';
import PlaylistsPage from './PlaylistsPage';
import ArtistsPage from './ArtistsPage';
import ReleasesPage from './ReleasesPage';
import {getUserInfo} from '../../core/apiCalls';
import CollectionSongsTable from '../collection/CollectionSongsTable';

const ARTISTS_TYPE = 'artists';
const PLAYLISTS_TYPE = 'playlists';
const RELEASES_TYPE = 'releases';
const SONGS_TYPE = 'songs';

class LibraryPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      artists : false,
      playlists : true,
      releases : false,
      songs : false,
      library: {},
      valid: false
    };
  }

  componentDidMount() {
    this.getUserLibrary();
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) this.getUserLibrary()
  }

  getUserLibrary() {
    catalog.getFullLibrary(this.props.id)
      .then(result => {
        this.setState({library: result});
        session.getAccessToken()
        .then (token => {
          getUserInfo(token, this.props.id)
            .then(user_data => this.setState({user: user_data}));
        })
      });
  }

  changeState(type) {
      this.setState({[type]: !this.state[type]});
    if(type === PLAYLISTS_TYPE) this.getUserLibrary();
  }

  render() {
    return (
      <div class={styles.libraryPage}>
        <h1>LIBRARY</h1>
        {this.state.user &&
        <div>
          <div><button onClick={this.changeState.bind(this, PLAYLISTS_TYPE)}>PLAYLISTS</button></div>
          {this.state[PLAYLISTS_TYPE] &&
          <PlaylistsPage user={this.state.user} playlists={this.state.library.playlists}/>}
          <div><button onClick={this.changeState.bind(this, ARTISTS_TYPE)}>ARTISTS</button></div>
          {this.state[ARTISTS_TYPE] &&
          <ArtistsPage artists={this.state.library.artists}/>}
          <div><button onClick={this.changeState.bind(this, RELEASES_TYPE)}>RELEASES</button></div>
          {this.state[RELEASES_TYPE] &&
          <ReleasesPage releases={this.state.library.releases}/>}
          <div><button onClick={this.changeState.bind(this, SONGS_TYPE)}>SONGS</button></div>
          {this.state[SONGS_TYPE] &&
          <CollectionSongsTable collection={{songs : this.state.library.songs}} />}
        </div>}
      </div>);
  }
}

export default LibraryPage;
