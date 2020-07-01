import {Component} from 'preact';

import {getReleasePlaylist, getUserPlaylists} from "../../core/apiCalls";
import {catalog, session} from "../../Harmony"
import styles from './CollectionPage.scss';
import image from './image.jpg';
import CollectionSongsTable from './CollectionSongsTable';
import ModalBox from './ModalBox';

const MODALBOX_PLAYLIST_DELETE = 'modalbox_playlist_delete';

class CollectionPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      userPlaylists: {},
      collectionType: '',
      modalBox : {type:'', message:''},
      stateUpdated : true
    }

    this.addNewPlaylist = this.addNewPlaylist.bind(this);
  }

  componentDidMount() {
    session.getAccessToken()
      .then (token => {
        let elem = (window.location.pathname).split('/');
        elem = elem.slice(Math.max(elem.length - 2))
        this.setState({collectionType : elem[0] + 's'})
        getReleasePlaylist(elem[0], elem[1], true, token)
          .then(result => {
            this.setState({collection: result});
            this.setState({songs: result.songs});
          })
          .catch( () => session.error = true);
        getUserPlaylists(token)
          .then(result => this.setState({userPlaylists: result}))
          .catch( () => session.error = true);
      })
  }

  initialLikeState (media_type, element) {
    if(element) {
      element.style = '-webkit-text-fill-color: transparent;';
      element.classList.remove("liked");
    }
    if(element && catalog.inLibrary(media_type, element.id)) {
      element.classList.add("liked");
      element.style = '-webkit-text-fill-color: white;';
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
        if (media_type === 'playlists' && session.getOwnData().id === this.state.collection.creator.id)
          media_type = 'personal_playlists';
        catalog.favorite('PUT', media_type, element.id)
        this.setState({stateUpdated: true});
      }
    }
  }

  userLikeOwnPlaylist() {
    return catalog.inLibrary('personal_playlists', this.state.collection.id);
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  addNewPlaylist(playlist_id, playlist_name) {
    let playlists = [...this.state.userPlaylists];
    const newPlaylist = {id: playlist_id, name: playlist_name, policiy: 'public'}
    playlists.push(newPlaylist);
    this.setState({userPlaylists: playlists});
  }
  
  render() {
    return (
      <div>
        {this.state.collection &&
        <div className={styles.releasePage}>
          <div>
            <div className={styles.releaseInfo}>
              {/*<img src={this.props.release.cover} alt={""}/>*/}
              <div><img src={image} alt={""}/></div>
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
                {this.state.stateUpdated && !this.userLikeOwnPlaylist() &&
                  <button onClick={this.liked.bind(this, this.state.collectionType)}>
                    <i id={this.state.collection.id} ref={this.initialLikeState.bind(this, this.state.collectionType)} className={"fa fa-star "}/>
                  </button>
                }
              </div>
            </div>
            <CollectionSongsTable
              initialLikeState={this.initialLikeState}
              likeSong={this.liked}
              handleModalBox={this.handleModalBox.bind(this)}
              collection={this.state.collection}
              userPlaylists={this.state.userPlaylists}
            />
            {this.state.stateUpdated && this.userLikeOwnPlaylist() &&
              <button onClick={this.handleModalBox.bind(this, MODALBOX_PLAYLIST_DELETE, this.state.collection.id)}>Delete</button>}
          </div>
          <ModalBox
              handleModalBox={this.handleModalBox.bind(this)}
              addNewPlaylist={this.addNewPlaylist}
              type={this.state.modalBox.type}
              message={this.state.modalBox.message}/>
        </div>
        }
      </div>);
  }
}

export default CollectionPage;
