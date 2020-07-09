import {Component} from 'preact';

import {mediaPlayer, catalog, session} from "../../Harmony"
import {MediaItemInfo, PlayStartModes} from "../../player/MediaPlayer";
import styles from './CollectionSongsTable.scss';
import {getUserPlaylists} from '../../core/apiCalls';
import ModalBox from './ModalBox';
import {IconMore, IconStarFull, IconStarEmpty, IconPlay, IconArrowRight, IconPause} from '../../assets/icons/icons';
import IconButton from '../IconButton';
import {route} from 'preact-router';
import {createMediaItemInfo} from '../../core/links';

const SONGS_TYPE = 'songs';
const FIRST_MENU = 'first';
const SECOND_MENU = 'second';
const MODALBOX_PLAYLIST = 'modalbox_playlist';
const MODAL_BOX_ERROR = 'modalbox_error';
const MODAL_BOX_SUCCESS = 'modalbox_success';

class CollectionSongsTable extends Component {

  constructor(props) {
    super(props);

    this.state = {
      modalBox : {type:'', message:''},
      updated : true,
      actualOrder: 'date',
      songPlayed : '5f0331e04a639de0cb76da8c'
    }
    this.addSongToPlaylist = this.addSongToPlaylist.bind(this);
    this.removeSongFromPlaylist = this.removeSongFromPlaylist.bind(this);
  }

  componentDidMount() {
    this.setState({songs: [...this.props.collection.songs]});
    session.getAccessToken()
      .then (token => {
        getUserPlaylists(token)
          .then(result => this.setState({userPlaylists: result}))
          .catch( () => session.error = true);
      })
  }

  initialSongLikeState (element_id) {
    return catalog.inLibrary(SONGS_TYPE, element_id);
  };

  likeSong(function_type, element_id) {
    catalog.favorite(function_type, SONGS_TYPE, element_id);
    this.setState({updated : true})
  }

  composeTime(time) {
    let date = new Date(time);
    let seconds = ('0' + date.getUTCSeconds()).slice(-2);
    let minutes = date.getUTCMinutes();
    let hours = date.getUTCHours();
    if (hours > 0)
      return hours + ":" + minutes + ":" + seconds;
    return minutes + ":" + seconds;
  }

  compare(a, b) {
      if (a < b) return -1;
      else if (a > b) return 1;
      else return 0;
    }

  reorderList(type) {
    let orderedList = [...this.state.songs];
    if(type === this.state.actualOrder) orderedList.reverse();
    else orderedList.sort((a, b) => {
      if(type === 'title') return this.compare(a.title, b.title);
      if(type === 'artist') return this.compare(a.artist.name, b.artist.name);
      if(type === 'release') return this.compare(a.release.name, b.release.name);
      if(type === 'length') return this.compare(a.length, b.length);
    })
    this.setState({songs : orderedList});
    this.setState({actualOrder : type});
  }

  isUserOwner() {
    if(this.props.collection.creator)
      return session.getOwnData().id === this.props.collection.creator.id;
    return false;
  }

  handleMenu(menu_window) {
    this.setState({menuWindow: menu_window});
  }

  handleMenuAndElementId(element_id) {
    this.setState({menuWindow: FIRST_MENU});
    this.setState({elementId: element_id})
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  newPlaylist(playlist_name) {
    catalog.createPlaylist(playlist_name)
      .then(playlist_id => {
        let playlists = [...this.state.userPlaylists];
        const newPlaylist = {id: playlist_id, name: playlist_name, policiy: 'public'}
        playlists.push(newPlaylist);
        this.setState({userPlaylists: playlists});
        catalog.updateSongInPlaylist('PUT', playlist_id, this.state.elementId)
          .then(()=> {
            this.handleModalBox(MODAL_BOX_SUCCESS, 'Playlist created successfully.');
            setTimeout(()=>this.handleModalBox('', ''),2000)
          })
      })
  }

  addSongToPlaylist(e) {
    catalog.updateSongInPlaylist('PUT', e.target.id, this.state.elementId)
      .then(() => {
        this.handleModalBox(MODAL_BOX_SUCCESS, 'Song added to the playlist.')
        setTimeout(()=> this.handleModalBox('', ''),2000)
      })
      .catch(() => {
        this.handleModalBox(MODAL_BOX_ERROR, 'Song already present in the playlist.')
        setTimeout(()=> this.handleModalBox('', '') ,2000)
      });
  }

  removeSongFromPlaylist() {
    catalog.updateSongInPlaylist('DELETE', this.props.collection.id, this.state.elementId)
      .then(this.setState( prevState => ({ songs: prevState.songs.filter(obj => obj.id !== prevState.elementId)})))
  }

  clickArtist(artist_id, e) {
     e.preventDefault();
     route('/artist/' + artist_id);
  }

  clickRelease(release_id, e) {
     e.preventDefault();
     route('/release/' + release_id);
  }

  playSong(song, start_mode) {
    let mediaItemInfo;
    this.props.isRelease
      ? mediaItemInfo = new MediaItemInfo(song.id, {
          [MediaItemInfo.TAG_TITLE]: song.title,
          [MediaItemInfo.TAG_RELEASE]: this.props.collection.name,
          [MediaItemInfo.TAG_ARTIST]: this.props.collection.artist.name,
          [MediaItemInfo.TAG_ALBUMART_URL]: this.props.collection.cover
        })
      : mediaItemInfo = createMediaItemInfo(song);

    mediaPlayer.play(mediaItemInfo, start_mode);
  }

  render() {

    return (
      <div>
        {this.state.songs && this.state.songs.length > 0 &&
        <div className={styles.songsInfo}>
          <table>
            <tr>
              <th/>
              <th/>
              <th><button onClick={this.reorderList.bind(this, 'title')}>Title</button></th>
              <th>
                {!this.props.isRelease &&
                <button onClick={this.reorderList.bind(this, 'artist')}>Artist</button>}
              </th>
              <th>
                {!this.props.isRelease &&
                <button onClick={this.reorderList.bind(this, 'release')}>Release</button>}
              </th>
              <th><button onClick={this.reorderList.bind(this, 'length')}>Time</button></th>
              <th/>
            </tr>
            {this.state.songs.map(element =>
              <tr onMouseLeave={this.handleMenu.bind(this, '')}>
                <td className={this.state.songPlayed === element.id ? styles.visibleButtons : styles.hidenButtons}>
                  <IconButton
                    size={22}
                    name={this.state.songPlayed === element.id ? "Pause" : "Play"}
                    icon={this.state.songPlayed === element.id ? IconPause : IconPlay}
                    onClick={this.state.songPlayed === element.id
                      ? () => mediaPlayer.pause()
                      : this.playSong.bind(this, element, PlayStartModes.APPEND_QUEUE_AND_PLAY)}/>
                </td>
                <td>
                  {this.state.updated && this.initialSongLikeState(element.id)
                    ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                                  onClick={this.likeSong.bind(this, 'DELETE', element.id)}/>
                    : <IconButton size={24} name="Like" icon={IconStarEmpty}
                                  onClick={this.likeSong.bind(this, 'PUT', element.id)}/>
                  }
                </td>
                <td>{element.title }</td>
                {!this.props.isRelease ?
                  [<td>
                    <a href='#' onClick={this.clickArtist.bind(this, element.artist.id)}>{element.artist.name}</a>
                  </td>,
                  <td>
                    <a href='#' onClick={this.clickRelease.bind(this, element.release.id)}>{element.release.name}</a>
                  </td>]
                  : [<td/>,<td/>]}
                <td>{this.composeTime(element.length)}</td>
                <td className={styles.hidenButtons}>
                  <IconButton size={24} name="Menu" icon={IconMore}
                        onClick={this.handleMenuAndElementId.bind(this, element.id)}/>
                  {(this.state.menuWindow === FIRST_MENU || this.state.menuWindow === SECOND_MENU)
                  && this.state.elementId === element.id &&
                    <div className={styles.dropdownMenu}>
                      <div onMouseLeave={this.handleMenu.bind(this, '')}>
                        <div>
                          <div
                          onMouseEnter={this.handleMenu.bind(this, SECOND_MENU)}
                          onClick={this.handleMenu.bind(this, SECOND_MENU)}
                          onMouseLeave={this.handleMenu.bind(this, FIRST_MENU)}>
                          Add To Playlist
                          <IconButton size={24} name="Add To Playlist" icon={IconArrowRight}/>

                          {this.state.menuWindow === SECOND_MENU && this.state.elementId === element.id &&
                            <div>
                              <div onMouseLeave={this.handleMenu.bind(this, FIRST_MENU)}>
                                <div>
                                <div>
                                  <button onClick={this.handleModalBox.bind(this, MODALBOX_PLAYLIST, this.state.elementId)}>
                                    New Playlist
                                  </button>
                                </div>
                                  <hr/>
                                {Object.values(this.state.userPlaylists)
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
                            <a href='#'
                               onClick={this.props.isRelease
                                 ? this.clickArtist.bind(this, this.props.collection.artist.id)
                                 : this.clickArtist.bind(this, element.artist.id)}>
                              Go To Artist
                            </a>
                          {!this.props.isRelease &&
                            <a href='#' onClick={this.clickRelease.bind(this, element.release.id)}>
                              Go To Release
                            </a>}
                          <hr/>
                          {this.isUserOwner() &&
                          <button onClick={this.playSong.bind(this, element, PlayStartModes.APPEND_QUEUE)}>
                            Add To Queue
                          </button>}
                        </div>
                      </div>
                    </div>}
                </td>
              </tr>
            )}
          </table>
          <ModalBox
            handleModalBox={this.handleModalBox.bind(this)}
            newPlaylist={this.newPlaylist.bind(this)}
            type={this.state.modalBox.type}
            message={this.state.modalBox.message}/>
        </div>}
      </div>
      );
  }
}

export default CollectionSongsTable;
