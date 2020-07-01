import {Component} from 'preact';

import styles from './CollectionPage.scss';
import {route} from 'preact-router';
import {catalog} from '../../Harmony';


const MODALBOX_PLAYLIST = 'modalbox_playlist';
const MODALBOX_PLAYLIST_DELETE = 'modalbox_playlist_delete';
const MODAL_BOX_ERROR = 'modalbox_error';
const MODAL_BOX_SUCCESS = 'modalbox_success';

class ModalBox extends Component {

  constructor(props) {
    super(props);

    this.state = {
      updated: true,
      newPlaylistName : ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.newPlaylist = this.newPlaylist.bind(this);
    this.deletePlaylist = this.deletePlaylist.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.type !== prevProps.type)
      this.setState({updated: true});
  }

  handleChange(e) {
    this.setState({newPlaylistName : e.target.value});
  }

  newPlaylist() {
    let playlist_name = this.state.newPlaylistName;
    if (!playlist_name) playlist_name = 'New Playlist';
    catalog.createPlaylist(playlist_name)
      .then(playlist_id => {
        this.props.addNewPlaylist(playlist_id, playlist_name);
        catalog.updateSongInPlaylist('PUT', playlist_id, this.props.message)
          .then(()=> {
            this.props.handleModalBox(MODAL_BOX_SUCCESS, 'Playlist created successfully.');
            setTimeout(this.props.handleModalBox('', ''),2000)
          })
      })
  }

  deletePlaylist(e) {
    e.preventDefault();
    catalog.favorite('DELETE', 'personal_playlists', this.props.message)
      .then(() => route('/library/me'));
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
              <input onClick={this.newPlaylist} type="submit" value="Create"/>
            </div>}
            {this.props.type === MODALBOX_PLAYLIST_DELETE &&
            <div>
              <p>Do you really want to delete this playlist?</p>
              <button onClick={this.props.handleModalBox.bind(this, '', '')}>Cancel</button>
              <button onClick={this.deletePlaylist}>Delete</button>
            </div>}
          </div>}
        </div>}
      </div>
    );
  }
}

export default ModalBox;
