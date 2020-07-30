import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {route} from 'preact-router';
import image from '../collection/image.jpg';
import {catalog, session} from '../../Harmony';
import ModalBox from '../collection/ModalBox';
import PlaylistImage from '../collection/PlaylistImage';

const MODALBOX_PLAYLIST = 'modalbox_playlist';
const MODAL_BOX_SUCCESS = 'modalbox_success';

class PlaylistsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      playlists : {
        personal : {},
        others : {}
      },
      modalBox : {type:'', message:''}
    }
  }

  componentDidMount() {
    this.setState({playlists : this.props.playlists});
  }

  clickPlaylist(playlist_id, e) {
     e.preventDefault();
     route('/playlist/' + playlist_id);
  }

  clickCreator(creator_id, e) {
     e.preventDefault();
     route('/user/' + creator_id);
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.user.id;
  }

  handleModalBox(modalbox_type, message, e) {
    e.preventDefault();
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  newPlaylist(playlist_name) {
    catalog.createPlaylist(playlist_name)
      .then(playlist_id => {
        const newPlaylist = {id: playlist_id, name: playlist_name, policiy: 'public', images: []}
        let personalPlaylists = [...this.state.playlists['personal']];
        personalPlaylists.push(newPlaylist);
        this.setState({modalBox: {type: MODAL_BOX_SUCCESS, message: 'Playlist created successfully.'}})
        setTimeout(()=>this.setState({modalBox: {type: '', message: ''}}),2000);
        this.setState(
    {playlists: {
            personal : personalPlaylists,
            others : this.state.playlists.others
          }})
      })
  }

  render() {
    return (
      <div className={styles.libraryCommon}>
        {Object.entries(this.state.playlists).map(([type, arrays]) => (
          <div>
            {this.isUserOwner()
              ? type === 'others'
                ? arrays.length > 0 && <div><hr/><p>Playlists you like</p></div>
                : [
                  <div><hr/><p>Realized by you</p></div>,
                  <span>
                  <a href='#' onClick={this.handleModalBox.bind(this, MODALBOX_PLAYLIST, '')}>
                    <img src={image} alt={""}/>
                  </a>
                  <p><a href='#' onClick={this.handleModalBox.bind(this, MODALBOX_PLAYLIST, '')}>New Playlist</a></p>
                </span>]
              : <div><hr/><p>Playlists {this.props.user.username} likes</p></div>}
            {
            Object.values(arrays).map(playlist =>
            <span>
              <a href='#' onClick={this.clickPlaylist.bind(this, playlist.id)}>
                <PlaylistImage images={playlist.images} size={150}/>
              </a>
              <p><a href='#' onClick={this.clickPlaylist.bind(this, playlist.id)}>{playlist.name}</a></p>
              {(type === 'others' || !this.isUserOwner()) &&
              <p>By <a href='#'
                       onClick={this.clickCreator.bind(this, playlist.creator.id)}>{playlist.creator.username}</a>
              </p>}
            </span>)}
          </div>)
          )}
        <ModalBox
          handleModalBox={this.handleModalBox.bind(this)}
          newPlaylist={this.newPlaylist.bind(this)}
          type={this.state.modalBox.type}
          message={this.state.modalBox.message}/>
      </div>
    );
  }
}
export default PlaylistsPage;
