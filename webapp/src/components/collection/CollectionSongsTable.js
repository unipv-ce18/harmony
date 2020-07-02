import {Component} from 'preact';

import {catalog, session} from "../../Harmony"
import styles from './CollectionSongsTable.scss';
import {getUserPlaylists} from '../../core/apiCalls';
import ModalBox from './ModalBox';

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
    }
    this.initialSongLikeState = this.initialSongLikeState.bind(this);
    this.likeSong = this.likeSong.bind(this);
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

  initialSongLikeState (element) {
    if(element) {
      element.style = '-webkit-text-fill-color: transparent;';
      element.classList.remove("liked");
    }
    if(element && catalog.inLibrary(SONGS_TYPE, element.id)) {
      element.classList.add("liked");
      element.style = '-webkit-text-fill-color: white;';
    }
  };

  likeSong(element) {
    if(element) {
      element = element.currentTarget.firstChild;
      if (element.classList.contains("liked")) {
        element.classList.remove("liked");
        element.style = '-webkit-text-fill-color: transparent;';
        catalog.favorite('DELETE', SONGS_TYPE, element.id)
      } else {
        element.classList.add("liked");
        element.style = '-webkit-text-fill-color: white;';
        catalog.favorite('PUT', SONGS_TYPE, element.id)
        this.setState({stateUpdated: true});
      }
    }
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
    if(type === 'date') this.setState({songs:[...this.props.collection.songs]});
    this.setState( prevState => ({ songs: prevState.songs.sort((a, b) => {
      if(type === 'title') return this.compare(a.title, b.title);
      if(type === 'artist') return this.compare(a.artist.name, b.artist.name);
      if(type === 'release') return this.compare(a.release.name, b.release.name);
      if(type === 'length') return this.compare(a.length, b.length);
    })}));
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
                {this.props.collection.creator &&
                <button onClick={this.reorderList.bind(this, 'artist')}>Artist</button>}
              </th>
              <th>
                {this.props.collection.creator &&
                <button onClick={this.reorderList.bind(this, 'release')}>Release</button>}
              </th>
              <th><button onClick={this.reorderList.bind(this, 'length')}>Time</button></th>
              <th/>
            </tr>
            {this.state.songs.map(element =>
              <tr onMouseLeave={this.handleMenu.bind(this, '')}>
                <td></td>
                <td>
                  <button onClick={this.likeSong}>
                    <i
                      ref={this.initialSongLikeState} id={element.id} className={"fa fa-star "}/>
                  </button>
                </td>
                <td>{element.title }</td>
                {this.props.collection.creator ? <td>{element.artist.name}</td> : <td/>}
                {this.props.collection.creator ? <td>{element.release.name}</td> : <td/>}
                <td>{this.composeTime(element.length)}</td>
                <td>
                  <button className={styles.menuButton}
                          onClick={this.handleMenuAndElementId.bind(this, element.id)}>
                    <i className={"fa fa-ellipsis-h"}/>
                  </button>
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
                          <i className={"fa fa-caret-right"}/>
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
                          <button onClick={this.removeSongFromPlaylist}>Remove</button>
                        }
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
