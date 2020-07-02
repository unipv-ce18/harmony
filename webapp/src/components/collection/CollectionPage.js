import {Component} from 'preact';

import {getReleasePlaylist} from "../../core/apiCalls";
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

    this.initialCollectionLikeState = this.initialCollectionLikeState.bind(this);
    this.likeCollection = this.likeCollection.bind(this);

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
      })
  }

  initialCollectionLikeState (element) {
    if(element && catalog.inLibrary(this.state.collectionType, this.state.collection.id)) {
      element.classList.add("liked");
      element.style = '-webkit-text-fill-color: white;';
    }
  };

  likeCollection(element) {
    let media_type = this.state.collectionType;
    if(element) {
      element = element.currentTarget.firstChild;
      if (element.classList.contains("liked")) {
        element.classList.remove("liked");
        element.style = '-webkit-text-fill-color: transparent;';
        catalog.favorite('DELETE', media_type, this.state.collection.id)
      } else {
        element.classList.add("liked");
        element.style = '-webkit-text-fill-color: white;';
        if (media_type === 'playlists' && session.getOwnData().id === this.state.collection.creator.id)
          media_type = 'personal_playlists';
        catalog.favorite('PUT', media_type, this.state.collection.id)
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
  
  render() {
    return (
      <div>
        {this.state.collection &&
        <div className={styles.collectionPage}>
          <div>
            <div className={styles.collectionInfo}>
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
                  <button onClick={this.likeCollection.bind(this)}>
                    <i id={this.state.collection.id} ref={this.initialCollectionLikeState} className={"fa fa-star "}/>
                  </button>
                }
              </div>
            <hr/>
            </div>
            <CollectionSongsTable collection={this.state.collection} />
            {this.state.stateUpdated && this.userLikeOwnPlaylist() &&
              <button onClick={this.handleModalBox.bind(this, MODALBOX_PLAYLIST_DELETE, this.state.collection.id)}>Delete</button>}
          </div>
          <ModalBox
            handleModalBox={this.handleModalBox.bind(this)}
            type={this.state.modalBox.type}
            message={this.state.modalBox.message}/>
        </div>
        }
      </div>);
  }
}

export default CollectionPage;
