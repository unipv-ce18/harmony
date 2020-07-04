import {Component} from 'preact';

import {getReleasePlaylist} from "../../core/apiCalls";
import {catalog, session} from "../../Harmony"
import styles from './CollectionPage.scss';
import image from './image.jpg';
import CollectionSongsTable from './CollectionSongsTable';
import ModalBox from './ModalBox';
import IconButton from '../IconButton';
import {IconStarEmpty, IconStarFull} from '../../assets/icons/icons';
import {route} from 'preact-router';
import PlayStates from '../../player/PlayStates';

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

    this.clickCreator = this.clickCreator.bind(this);
  }

  componentDidMount() {
    this.getCollection();
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) this.getCollection();
  }

  getCollection() {
    session.getAccessToken()
      .then (token => {
        let elem = (window.location.pathname).split('/');
        elem = elem.slice(Math.max(elem.length - 2))
        getReleasePlaylist(elem[0], elem[1], true, token)
          .then(result => {
            this.setState({collection: result});
            this.setState({songs: result.songs});
            this.setState({collectionType : elem[0] + 's'});
          })
          .catch( () => session.error = true);
      })
  }

  initialCollectionLikeState () {
    return catalog.inLibrary(this.state.collectionType, this.state.collection.id);
  };

  likeCollection(function_type) {
    let media_type = this.state.collectionType;
      if (function_type === 'PUT' &&
        media_type === 'playlists' &&
        session.getOwnData().id === this.state.collection.creator.id)
          media_type = 'personal_playlists';

      catalog.favorite(function_type, media_type, this.state.collection.id)
      this.setState({stateUpdated: true});
  }

  userLikeOwnPlaylist() {
    return catalog.inLibrary('personal_playlists', this.state.collection.id);
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  clickCreator(e) {
    e.preventDefault();
     route('/library/' + this.state.collection.creator.id);
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
                  <p>
                    <a href='#' onClick={this.clickCreator}>{this.state.collection.creator.username}</a></p>
                  <p>{this.state.collection['policy']}</p>
              </div>
              }
              <div>
                {this.state.stateUpdated && !this.userLikeOwnPlaylist() &&
                  (this.initialCollectionLikeState()
                    ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                                  onClick={this.likeCollection.bind(this, 'DELETE')}/>
                    : <IconButton size={24} name="Like" icon={IconStarEmpty}
                                  onClick={this.likeCollection.bind(this, 'PUT')}/>
                  )
                }
              </div>
            <hr/>
            </div>
            <CollectionSongsTable
              collection={this.state.collection}
              isRelease={this.state.collectionType === 'releases'}
            />
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
