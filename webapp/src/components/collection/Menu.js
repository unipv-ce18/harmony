import {Component} from 'preact';

import {mediaPlayer, catalog, session} from "../../Harmony"
import {MediaItemInfo, PlayStartModes} from "../../player/MediaPlayer";
import styles from './Menu.scss';
import {deleteSong} from '../../core/apiCalls';
import DownloadModal from './DownloadModal';
import ModalBox, {ModalBoxTypes} from '../modalbox/ModalBox';
import {IconArrowRight} from '../../assets/icons/icons';
import IconButton from '../IconButton';
import {route} from 'preact-router';
import {createMediaItemInfo} from '../../core/links';

const FIRST_MENU = 'first';
const SECOND_MENU = 'second';

class Menu extends Component {

  constructor(props) {
    super(props);

    this.state = {
      modalBox: {type:'', message:''}
    }

    this.addSongToPlaylist = this.addSongToPlaylist.bind(this);
    this.removeSongFromPlaylist = this.removeSongFromPlaylist.bind(this);
    this.removeSongFromRelease = this.removeSongFromRelease.bind(this);
  }

  handleMenu(menu_window) {
    this.setState({menuWindow: menu_window});
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  isUserOwner() {
    if(this.props.collection.creator)
      return session.currentUser?.id === this.props.collection.creator.id;
    return false;
  }

  userOwnRelease() {
    if (this.props.isRelease)
      return session.currentUser?.id === this.props.collection.artist.creator;
    return false;
  }

  isUserPro() {
    return session.currentUser?.tier === 'pro';
  }

  newPlaylist(temp_playlist_name) {
    let playlist_name = temp_playlist_name;
    if (!playlist_name) playlist_name = 'New Playlist';
    catalog.createPlaylist(playlist_name)
      .then(playlist_id => {
        let playlists = [...this.props.userPlaylists];
        const newPlaylist = {id: playlist_id, name: playlist_name, policiy: 'public'}
        playlists.push(newPlaylist);
        this.props.updateParentState({userPlaylists: playlists});
        catalog.updateSongInPlaylist('PUT', playlist_id, this.props.song.id)
          .then(()=> {
            this.handleModalBox(ModalBoxTypes.MODALBOX_SUCCESS, 'Playlist created successfully.');
            setTimeout(()=> {
              this.handleModalBox('', '');
              this.props.handleCloseMenu()
            },2000);
          })
      })
  }

  addSongToPlaylist(e) {
    catalog.updateSongInPlaylist('PUT', e.target.id, this.props.song.id)
      .then(() => {
        this.handleModalBox(ModalBoxTypes.MODALBOX_SUCCESS, 'Song added to the playlist.')
        setTimeout(()=> {
          this.handleModalBox('', '');
          this.props.handleCloseMenu();
        },2000)
      })
      .catch(() => {
        this.handleModalBox(ModalBoxTypes.MODALBOX_ERROR, 'Song already present in the playlist.')
        setTimeout(()=> {
          this.handleModalBox('', '');
          this.props.handleCloseMenu();
        },2000)
      });
  }

  removeSongFromPlaylist() {
    catalog.updateSongInPlaylist('DELETE', this.props.collection.id, this.props.song.id)
      .then(this.props.updateParentState
        (prevState => ({songs: prevState.songs.filter(obj => obj.id !== prevState.song.id)})))
      .catch( () => session.error = true);
  }

  removeSongFromRelease() {
    session.getAccessToken()
      .then (token => {
        deleteSong(this.props.song.id, token)
          .then(() => {this.props.updateParentState
          (prevState => ({songs: prevState.songs.filter(obj => obj.id !== prevState.song.id)}))})
          .catch( () => session.error = true);
      })
  }

  clickArtist(artist_id, e) {
     e.preventDefault();
     route('/artist/' + artist_id);
     this.props.handleCloseMenu();
  }

  clickRelease(release_id, e) {
     e.preventDefault();
     route('/release/' + release_id);
     this.props.handleCloseMenu();
  }

  createMediaInfo(song) {
    return createMediaItemInfo(song, this.props.isRelease ? this.props.collection : null);
  }

  addToQueue(song) {
    mediaPlayer.play(this.createMediaInfo(song), PlayStartModes.APPEND_QUEUE);
    this.handleModalBox(ModalBoxTypes.MODALBOX_SUCCESS, 'Song added to queue.');
    setTimeout(()=>{
      this.handleModalBox('', '');
      this.props.handleCloseMenu();
    },2000)
  }

  render() {
    let modalBox = this.state.modalBox;
    return (
      <div className={styles.dropdownMenu}>
        <div onMouseLeave={()=>this.props.handleCloseMenu}>
          <div>
            <div
            onMouseEnter={this.handleMenu.bind(this, SECOND_MENU)}
            onClick={this.handleMenu.bind(this, SECOND_MENU)}
            onMouseLeave={this.handleMenu.bind(this, FIRST_MENU)}>
            Add To Playlist
            <IconButton size={24} name="Add To Playlist" icon={IconArrowRight}/>
            {this.state.menuWindow === SECOND_MENU &&
              <div>
                <div onMouseLeave={this.handleMenu.bind(this, FIRST_MENU)}>
                  <div>
                    <div>
                      <button onClick={()=>this.handleModalBox(
                        ModalBoxTypes.MODALBOX_FORM_CREATE,'New Playlist')}>
                        New Playlist
                      </button>
                    </div>
                    <hr/>
                  {Object.values(this.props.userPlaylists)
                    .filter(el=> el.id !== this.props.collection.id)
                    .map(playlist =>
                    <div>
                      <button id={playlist.id} onClick={this.addSongToPlaylist}>{playlist.name}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            }
            </div>
            <hr/>
            {this.isUserOwner() &&
            <button onClick={this.removeSongFromPlaylist}>Remove From Playlist</button>}
            {this.userOwnRelease() &&
            <button onClick={()=>this.handleModalBox(ModalBoxTypes.MODALBOX_CONFIRM_DELETE,
              'Do you really want to delete this song?')}>Remove From Release</button>}
            <a href='#'
               onClick={this.props.isRelease
                 ? this.clickArtist.bind(this, this.props.collection.artist.id)
                 : this.clickArtist.bind(this, this.props.song.artist.id)}>
              Go To Artist
            </a>
            {!this.props.isRelease &&
            <a href='#' onClick={this.clickRelease.bind(this, this.props.song.release.id)}>
              Go To Release
            </a>}
            <hr/>
            {console.log(this.isUserPro())}
            {this.isUserPro() &&
              <button onClick={this.props.updateParentState.bind(this, {downloadModal: true})}>Download song</button>}
            <button onClick={this.addToQueue.bind(this, this.props.song)}>
              Add To Queue
            </button>
          </div>
        </div>
        {modalBox.type &&
          <ModalBox
            type={modalBox.type}
            message={modalBox.message}
            placeholder={modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? 'Playlist Name' : ''}
            handleCancel={()=>{this.handleModalBox('', ''); this.props.handleCloseMenu()}}
            handleSubmit={
              modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? this.newPlaylist.bind(this) :
              modalBox.type === ModalBoxTypes.MODALBOX_CONFIRM_DELETE ? this.removeSongFromRelease.bind(this) : null}
            />}
      </div>
    );
  }
}

export default Menu;
