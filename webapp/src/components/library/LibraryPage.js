import {Component} from 'preact';

import library from './testLibrary';
import styles from './LibraryPage.scss';

class LibraryPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "playlists"
    };

    this.showMenu = this.showMenu.bind(this);
  }

  showMenu(e) {
    this.setState({show: e.target.name});
  }


  render() {

    let playlList = [];
    let artistsList = [];
    let releasesList = [];
    let songsList = [];

    for (let [key, value] of Object.entries(library)) {
      if (key === 'playlists') {
        value.forEach(function (playlist) {
          let playlObj = {};
          for (let [key2, value2] of Object.entries(playlist)) {
            playlObj[key2] = value2;
          }
          playlList.push(playlObj);
        });
      } else if (key === 'artists') {
        value.forEach(function (artist) {
          let artistObj = {};
          for (let [key2, value2] of Object.entries(artist)) {
            artistObj[key2] = value2;
          }
          artistsList.push(artistObj);
        });
      } else if (key === 'releases') {
        value.forEach(function (release) {
          releasesList.push(release);
        });
      } else if (key === 'songs') {
        value.forEach(function (song) {
          songsList.push(song);
        });
      }
    }

    function compare(a, b) {
      if (a < b) return -1;
      else if (a > b) return 1;
      else return 0;
    }

    artistsList.sort((a, b) => compare(a.artist, b.artist));
    releasesList.sort((a, b) => compare(a.name, b.name));
    songsList.sort((a, b) => compare(a.title, b.title));

    return (
      <div class={styles.libraryPage}>
        <div class={styles.libraryPageContent}>
          <div>
            <h1>YOUR LIBRARY</h1>
            <div>
              <div class={styles.inputs}>
                <span>
                  <input type="button" name="playlists" value="PLAYLISTS" onClick={this.showMenu}/>
                  <input type="button" name="artists" value="ARTISTS" onClick={this.showMenu}/>
                  <input type="button" name="releases" value="RELEASES" onClick={this.showMenu}/>
                  <input type="button" name="songs" value="SONGS" onClick={this.showMenu}/>
                </span>
              </div>
              <div>
                {this.state.show === "playlists" && <div class={styles.playlists}>
                  {playlList.map(item =>
                    <span>
                      <img src={require('../release/' + item.cover)} alt={""}/>
                      <p>{item.name}</p><p>By {item.creator}</p>
                    </span>)
                  }</div>}
                {this.state.show === "artists" && <div class={styles.playlists}>
                  {artistsList.map(item =>
                    <span>
                      <img src={require('../release/' + item.cover)} alt={""}/>
                      <p>{item.artist}</p>
                    </span>)
                  }</div>}
                {this.state.show === "releases" && <div class={styles.playlists}>
                  {releasesList.map(item =>
                    <span>
                      <img src={require('../release/' + item.cover)} alt={""}/>
                      <p>{item.name}</p>
                      <p>By {item.artist}</p>
                    </span>)
                  }</div>}
                {this.state.show === "songs" && <div class={styles.playlists}>
                  {songsList.map(item => <p>{item.title} - {item.artist}</p>)}
                </div>}
              </div>
            </div>

          </div>
        </div>
      </div>);
  }
}

export default LibraryPage;
