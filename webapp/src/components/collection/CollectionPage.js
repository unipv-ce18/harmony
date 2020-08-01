import {route} from 'preact-router';
import {Component} from 'preact';

import {getReleasePlaylist, deleteRelease} from "../../core/apiCalls";
import {catalog, mediaPlayer, session} from "../../Harmony"
import styles from './CollectionPage.scss';
import CollectionSongsTable from './CollectionSongsTable';
import ModalBox from '../ModalBox';
import IconButton from '../IconButton';
import {
  IconQueue,
  IconStarEmpty,
  IconStarFull
} from '../../assets/icons/icons';
import {createMediaItemInfo} from '../../core/links';
import {MediaItemInfo, PlayStartModes} from '../../player/MediaPlayer';
import ReleaseInfo from './ReleaseInfo';
import PlaylistInfo from './PlaylistInfo';

const MODALBOX_PLAYLIST_DELETE = 'modalbox_playlist_delete';
const MODALBOX_RELEASE_DELETE = 'modalbox_release_delete';
const MODAL_BOX_SUCCESS = 'modalbox_success';

class CollectionPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      userPlaylists: {},
      collectionType: '',
      modalBox : {type:'', message:''},
      songPlayed : '',
      playlistPolicy : '',
      stateUpdated : true
    }

    this.addSongsToQueue = this.addSongsToQueue.bind(this);
    this.deleteReleasePage = this.deleteReleasePage.bind(this);
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

  isRelease() {
    return this.state.collectionType === 'releases';
  }

  userOwnRelease() {
    if (this.state.collectionType === 'releases')
      return session.getOwnData().id === this.state.collection.artist.creator;
    return false;
  }

  createSong(song) {
    if(this.isRelease())
      return new MediaItemInfo(song.id, {
          [MediaItemInfo.TAG_TITLE]: song.title,
          [MediaItemInfo.TAG_RELEASE]: this.state.collection.name,
          [MediaItemInfo.TAG_ARTIST]: this.state.collection.artist.name,
          [MediaItemInfo.TAG_ALBUMART_URL]: this.state.collection.cover
        })
    return createMediaItemInfo(song);
  }

  addSongsToQueue() {
    let arrayMediaInfo = this.state.collection.songs.map(song => {
      console.log(song.title);
      return this.createSong(song)});
    mediaPlayer.play(arrayMediaInfo, PlayStartModes.APPEND_QUEUE);
    this.handleModalBox(MODAL_BOX_SUCCESS, 'Songs added to queue.');
    setTimeout(()=>this.handleModalBox('', ''),2000)
  }

  deleteReleasePage() {
    session.getAccessToken()
      .then (token => {
        deleteRelease(this.state.collection.id, token)
          .then(result => {
            route('/artist/' + this.state.collection.artist.id);
          })
          .catch( () => session.error = true);
      })
  }

  render() {
    return (
      <div>
        {this.state.collection &&
        <div className={styles.collectionPage}>
          <div>
            <div className={styles.collectionInfo}>
              {this.isRelease()
              ? <ReleaseInfo collection={this.state.collection}/>
              : <PlaylistInfo collection={this.state.collection}/>}
              <div>
                {this.state.stateUpdated && !this.userLikeOwnPlaylist() &&
                  (this.initialCollectionLikeState()
                    ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                                  onClick={this.likeCollection.bind(this, 'DELETE')}/>
                    : <IconButton size={24} name="Like" icon={IconStarEmpty}
                                  onClick={this.likeCollection.bind(this, 'PUT')}/>
                  )
                }
                <IconButton
                  size={22}
                  name={"Add To Queue"}
                  icon={IconQueue}
                  onClick={this.addSongsToQueue}/>
              </div>
            <hr/>
            </div>
            <CollectionSongsTable
              collection={this.state.collection}
              isRelease={this.isRelease()}
            />
            {this.state.stateUpdated && this.userLikeOwnPlaylist() &&
              <button
                onClick={this.handleModalBox.bind(this, MODALBOX_PLAYLIST_DELETE, this.state.collection.id)}>Delete
              </button>}
              {this.state.stateUpdated && this.userOwnRelease() &&
                <button
                  onClick={this.handleModalBox.bind(this, MODALBOX_RELEASE_DELETE, this.state.collection.id)}>Delete
                </button>}
          </div>
          <ModalBox
            handleModalBox={this.handleModalBox.bind(this)}
            removeRelease={this.deleteReleasePage.bind(this)}
            type={this.state.modalBox.type}
            message={this.state.modalBox.message}/>
        </div>
        }
      </div>);
  }
}

export default CollectionPage;
