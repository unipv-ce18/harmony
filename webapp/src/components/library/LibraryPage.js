import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {catalog, session} from '../../Harmony';
import SongsPage from './SongsPage';
import PlaylistsPage from './PlaylistsPage';
import ArtistsPage from './ArtistsPage';
import ReleasesPage from './ReleasesPage';
import {getUserInfo} from '../../core/apiCalls';

class LibraryPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "",
      library: {},
      valid: false
    };
  }

  showMenu(type) {
    this.setState({show: type});
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
        this.setState({show: 'playlists'});
        session.getAccessToken()
        .then (token => {
          getUserInfo(token, this.props.id)
            .then(user_data => this.setState({user: user_data}));
        })
      });
  }


  render() {
    return (
      <div class={styles.libraryPage}>
        <div class={styles.libraryPageContent}>
          <div>
            <h1>YOUR LIBRARY</h1>
            <div>
              <div class={styles.inputs}>
                <span>
                  <button onClick={this.showMenu.bind(this, "playlists")}>PLAYLISTS</button>
                  <button onClick={this.showMenu.bind(this, "artists")}>ARTISTS</button>
                  <button onClick={this.showMenu.bind(this, "releases")}>RELEASES </button>
                  <button onClick={this.showMenu.bind(this, "songs")}>SONGS </button>
                </span>
              </div>
              {this.state.user &&
              <div>
                {this.state.show === "playlists" && <PlaylistsPage user={this.state.user} playlists={this.state.library.playlists}/>}
                {this.state.show === "artists" && <ArtistsPage artists={this.state.library.artists}/>}
                {this.state.show === "releases" && <ReleasesPage releases={this.state.library.releases}/>}
                {this.state.show === "songs" && <SongsPage songs={this.state.library.songs}/>}
              </div>}
            </div>
          </div>
        </div>
      </div>);
  }
}

export default LibraryPage;
