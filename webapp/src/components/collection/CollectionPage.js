import {Component} from 'preact';

import {getReleasePlaylist, getUserPlaylists} from "../../core/apiCalls";
import {catalog, session} from "../../Harmony"
import styles from './CollectionPage.scss';
import image from './image.jpg';
import {route} from 'preact-router';


const SONGS_TYPE = 'songs';

class CollectionPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      userPlaylists: {},
      collectionType: '',
      firstWindow : '',
      secondWindow : '',
      newPlaylistWindow : '',
      newPlaylistName : '',
      deleteClicked : false
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.addSongToPlaylist = this.addSongToPlaylist.bind(this);
  }

  componentDidMount() {
    session.getAccessToken()
      .then (token => {
        let elem = (window.location.pathname).split('/');
        elem = elem.slice(Math.max(elem.length - 2))
        this.setState({collectionType : elem[0] + 's'})
        getReleasePlaylist(elem[0], elem[1], true, token)
          .then(result => {this.setState({collection: result});})
          .catch( e => {session.error = true;});
        getUserPlaylists(token)
          .then(result => {this.setState({userPlaylists: result});})
          .catch( e => {session.error = true;});
      })
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

  initialLikeState (media_type, element) {
    if(element && catalog.inLibrary(media_type, element.firstChild.id)) {
      element.firstChild.classList.add("liked");
      element.firstChild.style = '-webkit-text-fill-color: white;';
    }
  };

  liked(media_type, element) {
    if(element) {
      element = element.currentTarget.firstChild;
      if (element.classList.contains("liked")) {
        element.classList.remove("liked");
        element.style = '-webkit-text-fill-color: transparent;';
        catalog.favorite('DELETE', media_type, element.id)
      } else {
        element.classList.add("liked");
        element.style = '-webkit-text-fill-color: white;';
        catalog.favorite('PUT', media_type, element.id)
      }
    }
  }

  isUserOwner() {
    return catalog.inLibrary('personal_playlists', this.state.collection.id);
  }

  handleClick(element_id) {
    this.state.firstWindow === element_id ?
      this.setState({firstWindow: ''}) : this.setState({firstWindow: element_id});
  }
  handleMouseEnter(element_id) {
    this.state.secondWindow === element_id ?
      this.setState({secondWindow: ''}) : this.setState({secondWindow: element_id});
  }
  handleMouseLeave(window) {
    if(this.state.secondWindow) this.setState({secondWindow: ''});
    if(window === 'first' && this.state.firstWindow) this.setState({firstWindow: ''});
  }
  closeNewPlaylistWindow() {
    this.setState({newPlaylistName : ''});
    this.setState({newPlaylistWindow : ''});
  }
  handleChange(e) {
    this.setState({newPlaylistName : e.target.value});
  }
  handleSubmit(e) {
    e.preventDefault();
    let name = this.state.newPlaylistName;
    if (!name) name = 'New Playlist';
    catalog.createPlaylist(name)
      .then(playlist_id => {
        catalog.addSongToPlaylist(playlist_id, this.state.newPlaylistWindow)
        this.closeNewPlaylistWindow();
      })
  }
  deleteButton(bool) {
    this.setState({deleteClicked : bool});
  }

  deleteConfirmed(e) {
    catalog.favorite('DELETE', 'personal_playlists', this.state.collection.id)
      .then(() => route('/library/me'));
  }

  addSongToPlaylist(e) {
    catalog.addSongToPlaylist(e.target.id, this.state.secondWindow);
  }

  render() {
    return (
      <div>
        {this.state.collection &&
        <div className={styles.releasePage}>
          <div>
            <div>
              {/*<img src={this.props.release.cover} alt={""}/>*/}
              <img src={image} alt={""}/>
              {this.state.collectionType === 'releases' &&
                <div>
                  <p>{this.state.collection.type}</p>
                  <p>{this.state.collection.name}</p>
                  <p>{this.state.collection.artist.name}</p>
                  <p>{this.state.collection.date}</p>
                </div>
              }{this.state.collectionType === 'playlists' &&
                <div>
                  <p>Playlist</p>
                  <p>{this.state.collection.name}</p>
                  <p>{this.state.collection.creator.username}</p>
                  <p>{this.state.collection['policy']}</p>
              </div>
              }
              <div>
                {!this.isUserOwner() &&
                  <button onClick={this.liked.bind(this, this.state.collectionType)}
                          ref={this.initialLikeState.bind(this, this.state.collectionType)}>
                    <i id={this.state.collection.id} className={"fa fa-star "}/>
                  </button>
                }
              </div>

            </div>
            <div>
              {this.state.collection.songs.map(item =>
                <div>
                  <hr/>
                  <div>
                    <button onClick={this.liked.bind(this, SONGS_TYPE)}
                            ref={this.initialLikeState.bind(this, SONGS_TYPE)}>
                      <i id={item.id} className={"fa fa-star "}/></button>
                    <span>{item.title}</span>
                    <span>{this.composeTime(item.length)}</span>
                    <button onClick={this.handleClick.bind(this, item.id)}>
                      <i className={"fa fa-ellipsis-h"}/>
                    </button>
                    {this.state.firstWindow === item.id &&
                    <div onMouseLeave={this.handleMouseLeave.bind(this, 'first')}>
                      <div
                        onMouseEnter={this.handleMouseEnter.bind(this, item.id)}
                        onMouseLeave={this.handleMouseLeave.bind(this, 'second')}>
                        Add To Playlist
                        <i className={"fa fa-caret-right"}/>
                        {this.state.secondWindow === item.id &&
                        <div onMouseLeave={this.handleMouseLeave.bind(this, 'second')}>
                          <div>
                            <button onClick={()=>this.setState({newPlaylistWindow : item.id})}>New Playlist</button>
                          </div>

                          {Object.values(this.state.userPlaylists).map(playlist =>
                            <div>
                              <button id={playlist.id} onClick={this.addSongToPlaylist}>{playlist.name}</button>
                            </div>
                          )}

                        </div>
                        }
                      </div>
                      <div>Like Onions</div>
                    </div>}
                  </div>
                  {this.state.newPlaylistWindow &&
                  <div className={styles.modalBox}>
                    <div>
                      <button
                        onClick={this.closeNewPlaylistWindow}>&times;
                      </button>
                      <p>New Playlist</p>
                        <input type="text" placeholder="Playlist Name" onChange={this.handleChange}/>
                        <input onClick={this.handleSubmit} type="submit" value="Create"/>
                    </div>
                  </div>
                  }
                </div>
              )}
            </div>
            {this.isUserOwner() &&
              <button onClick={this.deleteButton.bind(this, true)}>Delete</button>}
            <div>
              {this.state.deleteClicked &&
                <div className={styles.modalBox}>
                  <div>
                    <button
                      onClick={this.deleteButton.bind(this, false)}>&times;
                    </button>
                    <p>Do you really want to delete this playlist?</p>
                    <button onClick={this.deleteButton.bind(this, false)}>Cancel</button>
                    <button onClick={this.deleteConfirmed.bind(this)}>Delete</button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
        }
      </div>);
  }
}

export default CollectionPage;
