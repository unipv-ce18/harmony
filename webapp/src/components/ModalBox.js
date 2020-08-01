import {Component} from 'preact';

import styles from './ModalBox.scss';
import {route} from 'preact-router';
import {catalog} from '../Harmony';


const MODALBOX_PLAYLIST = 'modalbox_playlist';
const MODALBOX_PLAYLIST_DELETE = 'modalbox_playlist_delete';

const MODALBOX_ARTIST = 'modalbox_artist';
const MODALBOX_ARTIST_DELETE = 'modalbox_artist_delete';

const MODALBOX_RELEASE = 'modalbox_release';
const MODALBOX_RELEASE_DELETE = 'modalbox_release_delete';

const MODALBOX_SONG_DELETE = 'modalbox_song_delete'

const MODAL_BOX_ERROR = 'modalbox_error';
const MODAL_BOX_SUCCESS = 'modalbox_success';

class ModalBox extends Component {

  constructor(props) {
    super(props);

    this.state = {
      updated: true,
      newName : ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.addNewPlaylist = this.addNewPlaylist.bind(this);
    this.deletePlaylist = this.deletePlaylist.bind(this);
    this.addNewArtist = this.addNewArtist.bind(this);
    this.removeArtistPage = this.removeArtistPage.bind(this);
    this.addNewRelease = this.addNewRelease.bind(this);
    this.removeReleasePage = this.removeReleasePage.bind(this);
    this.deleteSongFromRelease = this.deleteSongFromRelease.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.type !== prevProps.type)
      this.setState({updated: true});
  }

  handleChange(e) {
    this.setState({newName : e.target.value});
  }

  addNewPlaylist() {
    let playlist_name = this.state.newName;
    if (!playlist_name) playlist_name = 'New Playlist';
    this.props.newPlaylist(playlist_name);
  }

  deletePlaylist(e) {
    e.preventDefault();
    catalog.favorite('DELETE', 'personal_playlists', this.props.message)
      .then(() => route('/library/me'));
  }

  addNewArtist() {
    let artist_name = this.state.newName;
    if (!artist_name) artist_name = 'New Artist';
    this.props.newArtist(artist_name);
  }

  removeArtistPage(e) {
    this.props.removeArtist();
  }

  addNewRelease() {
    let release_name = this.state.newName;
    if (!release_name) release_name = 'New Release';
    this.props.newRelease(release_name);
  }

  removeReleasePage(e) {
    this.props.removeRelease();
  }

  deleteSongFromRelease(e) {
    this.props.removeSong();
  }

  render() {
    return (
      <div>
        {this.state.updated && this.props.type &&
        <div className={styles.modalBox}>
          {this.props.type === MODAL_BOX_SUCCESS &&
          <div className={styles.modalSuccess}>
            <p>{this.props.message}</p>
          </div>}
          {this.props.type === MODAL_BOX_ERROR &&
          <div className={styles.modalError}>
            <p>{this.props.message}</p>
          </div>}
          {this.props.type !== MODAL_BOX_SUCCESS && this.props.type !== MODAL_BOX_ERROR &&
          <div>
            <button
              onClick={this.props.handleModalBox.bind(this, '', '')}>&times;
            </button>
            {this.props.type === MODALBOX_PLAYLIST &&
            <div>
              <p>New Playlist</p>
              <input type="text" placeholder="Playlist Name" onChange={this.handleChange}/>
              <input onClick={this.addNewPlaylist} type="submit" value="Create"/>
            </div>}
            {this.props.type === MODALBOX_PLAYLIST_DELETE &&
            <div>
              <p>Do you really want to delete this playlist?</p>
              <button onClick={this.props.handleModalBox.bind(this, '', '')}>Cancel</button>
              <button onClick={this.deletePlaylist}>Delete</button>
            </div>}
            {this.props.type === MODALBOX_ARTIST &&
            <div>
              <p>New Artist</p>
              <input type="text" placeholder="Artist Name" onChange={this.handleChange}/>
              <input onClick={this.addNewArtist} type="submit" value="Create"/>
            </div>}
            {this.props.type === MODALBOX_ARTIST_DELETE &&
            <div>
              <p>Do you really want to delete this artist?</p>
              <button onClick={this.props.handleModalBox.bind(this, '', '')}>Cancel</button>
              <button onClick={this.removeArtistPage}>Delete</button>
            </div>}
            {this.props.type === MODALBOX_RELEASE &&
            <div>
              <p>New Release</p>
              <input type="text" placeholder="Release Name" onChange={this.handleChange}/>
              <input onClick={this.addNewRelease} type="submit" value="Create"/>
            </div>}
            {this.props.type === MODALBOX_RELEASE_DELETE &&
            <div>
              <p>Do you really want to delete this release?</p>
              <button onClick={this.props.handleModalBox.bind(this, '', '')}>Cancel</button>
              <button onClick={this.removeReleasePage}>Delete</button>
            </div>}
            {this.props.type === MODALBOX_SONG_DELETE &&
            <div>
              <p>Do you really want to delete this song?</p>
              <button onClick={this.props.handleModalBox.bind(this, '', '')}>Cancel</button>
              <button onClick={this.deleteSongFromRelease}>Delete</button>
            </div>}
          </div>}
        </div>}
      </div>
    );
  }
}

export default ModalBox;
