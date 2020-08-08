import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {route} from 'preact-router';
import {DEFAULT_NEW_CONTENT_IMAGE_URL} from '../../assets/defaults';

import {catalog, session} from '../../Harmony';
import ModalBox, {ModalBoxTypes} from '../modalbox/ModalBox';
import PlaylistImage from '../collection/PlaylistImage';

class PlaylistsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      playlists : {
        joined: []
      },
      modalBox : {type:'', message:''}
    }
  }

  componentDidMount() {
    if (this.isUserOwner()) this.setState({playlists : this.props.playlists});
    else this.setState(
      {playlists : { joined : [...this.props.playlists.personal,...this.props.playlists.others]}});
  }

  componentDidUpdate(prevProps) {
    if (this.props.playlists !== prevProps.playlists || this.props.user.id !== prevProps.user.id) {
      if (this.isUserOwner()) this.setState({playlists: this.props.playlists});
      else this.setState(
        {playlists: { joined: [...this.props.playlists.personal, ...this.props.playlists.others]}});
    }
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

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  newPlaylist(temp_playlist_name) {
    let playlist_name = temp_playlist_name;
    if (!playlist_name) playlist_name = 'New Playlist';
    catalog.createPlaylist(playlist_name)
      .then(playlist_id => {
        const newPlaylist = {id: playlist_id, name: playlist_name, policiy: 'public', images: []}
        let personalPlaylists = [...this.state.playlists['personal']];
        personalPlaylists.push(newPlaylist);
        this.setState({modalBox: {
          type: ModalBoxTypes.MODALBOX_SUCCESS,
          message: 'Playlist created successfully.'}})
        setTimeout(()=>this.setState({modalBox: {type: '', message: ''}}),2000);
        this.setState(
    {playlists: {
            personal : personalPlaylists,
            others : this.state.playlists.others
          }})
      })
  }

  render() {
    let playlists = this.state.playlists;
    let modalBox = this.state.modalBox;
    return (
      <div>
        {(this.isUserOwner() || !this.isUserOwner() && playlists.joined.length) > 0 && <div>
        {Object.entries(playlists).map(([type, arrays]) => (
          <div className={styles.libraryCommon}>
            {this.isUserOwner()
              ? type === 'others'
                ? arrays.length > 0 && <div><hr/><p>Playlists you like</p></div>
                : [<div><hr/><p>Realized by you</p></div>,
                  <span>
                  <a href='#'
                     onClick={this.handleModalBox.bind(this, ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Playlist')}>
                    <img src={DEFAULT_NEW_CONTENT_IMAGE_URL} alt={""}/>
                  </a>
                  <p><a href='#'
                        onClick={this.handleModalBox.bind(this, ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Playlist')}>
                    New Playlist</a></p>
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
        </div>}
        {modalBox.type &&
        <ModalBox
          type={modalBox.type}
          message={modalBox.message}
          placeholder={modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? 'Playlist Name' : ''}
          handleCancel={()=>this.handleModalBox('', '')}
          handleSubmit={this.newPlaylist.bind(this)}/>}
      </div>
    );
  }
}
export default PlaylistsPage;
