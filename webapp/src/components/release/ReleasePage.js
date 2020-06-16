import {Component} from 'preact';

import {getLibrary, getRelease} from "../../core/apiCalls";
import {catalog, session} from "../../Harmony"
import styles from './ReleasePage.scss';
import image from './image.jpg';


const SONGS_TYPE = 'songs';
const RELEASES_TYPE = 'releases';

class ReleasePage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      firstWindow : '',
      secondWindow : '',
      newPlaylistWindow : '',
      newPlaylistName : ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    return session.getAccessToken()
      .then (token => {
        getRelease(/[^/]*$/.exec(window.location.href)[0], true, token)
          .then(result => {
            this.setState({release: result});
          })
          .catch( e => {
            session.error = true;
          });
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

  handleClick(element_id) {
    this.state.firstWindow === element_id ? this.setState({firstWindow: ''}) : this.setState({firstWindow: element_id});
  }
  handleMouseEnter(element_id) {
    this.state.secondWindow === element_id ? this.setState({secondWindow: ''}) : this.setState({secondWindow: element_id});
  }
  handleMouseLeave(window) {
    if(this.state.secondWindow) this.setState({secondWindow: ''});
    if(window === 'first' && this.state.firstWindow) this.setState({firstWindow: ''});
  }
  closeNewPlaylistWindow() {
    this.setState({newPlaylistWindow : ''});
    this.setState({newPlaylistName : ''});
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


  render() {
    return (
      <div>
        {this.state.release &&
        <div className={styles.releasePage}>
          <div>
            <div>
              {/*<img src={this.props.release.cover} alt={""}/>*/}
              <img src={image} alt={""}/>
              <div>
                <p>{this.state.release.type}</p>
                <p>{this.state.release.name}</p>
                <p>{this.state.release.artist.name}</p>
                <p>{this.state.release.date}</p>
              </div>
              <div>
                <button onClick={this.liked.bind(this, RELEASES_TYPE)}
                        ref={this.initialLikeState.bind(this, RELEASES_TYPE)}>
                  <i id={this.state.release.id} className={"fa fa-star "}/>
                </button>
              </div>

            </div>
            <div>
              {this.state.release.songs.map(item =>
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
                          <div><button>Playlist1</button></div>
                          <div><button>Playlist2</button></div>
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
          </div>
        </div>
        }
      </div>);
  }
}

export default ReleasePage;
