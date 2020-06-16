import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {catalog} from '../../Harmony';
import SongsPage from './SongsPage';
import PlaylistsPage from './PlaylistsPage';
import ArtistsPage from './ArtistsPage';
import ReleasesPage from './ReleasesPage';

class LibraryPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "playlists",
      library: {},
      valid: false
    };

    this.showMenu = this.showMenu.bind(this);
  }

  showMenu(type) {
    this.setState({show: type});
  }

  componentDidMount() {
    catalog.getFullLibrary(/[^/]*$/.exec(window.location.href)[0])
      .then(result => {
        this.setState({library: result});
        this.setState({valid: true});
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
                  <button onClick={()=>this.showMenu("playlists")}>PLAYLISTS</button>
                  <button onClick={()=>this.showMenu("artists")}>ARTISTS</button>
                  <button onClick={()=>this.showMenu("releases")}>RELEASES </button>
                  <button onClick={()=>this.showMenu("songs")}>SONGS </button>
                </span>
              </div>
                {this.state.valid && this.state.show === "playlists" && <PlaylistsPage playlists={this.state.library.playlists}/>}
                {this.state.valid && this.state.show === "artists" && <ArtistsPage artists={this.state.library.artists}/>}
                {this.state.valid && this.state.show === "releases" && <ReleasesPage releases={this.state.library.releases}/>}
                {this.state.valid && this.state.show === "songs" && <SongsPage songs={this.state.library.songs}/>}
            </div>
          </div>
        </div>
      </div>);
  }
}

export default LibraryPage;
