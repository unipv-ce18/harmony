import {route} from 'preact-router';
import {Component} from 'preact';

import {getReleasePlaylist, deleteRelease, patchUser, patchRelease, patchPlaylist} from "../../core/apiCalls";
import {catalog, mediaPlayer, session} from "../../Harmony"
import styles from './CollectionPage.scss';
import CollectionSongsTable from './CollectionSongsTable';
import IconButton from '../IconButton';
import {
  IconQueue,
  IconStarEmpty,
  IconStarFull
} from '../../assets/icons/icons';
import {createMediaItemInfo} from '../../core/links';
import {PlayStartModes} from '../../player/MediaPlayer';
import ReleaseInfo from './ReleaseInfo';
import PlaylistInfo from './PlaylistInfo';
import ModalBox from '../modalbox/ModalBox';
import {ModalBoxTypes} from '../modalbox/ModalBox';

class CollectionPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      userPlaylists: {},
      collectionType: '',
      modalBox : {type:'', message:''},
      songPlayed : '',
      playlistPolicy : '',
      inUpdate : false,
      pageUpdated : false
    }

    this.addSongsToQueue = this.addSongsToQueue.bind(this);
    this.handleConfirmDelete = this.handleConfirmDelete.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
    this.handleClickUpdate = this.handleClickUpdate.bind(this);
  }

  componentDidMount() {
    this.getCollection();
  }

  componentDidUpdate(prevProps, prevStates) {
    if (this.props.id !== prevProps.id) this.getCollection();
    else if (this.state.update && !prevStates.update) {
      this.getCollection();
      this.setState({pageUpdated : false});
    }
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
    return createMediaItemInfo(song, this.isRelease() ? this.state.collection : null);
  }

  addSongsToQueue() {
    let arrayMediaInfo = this.state.collection.songs.map(song => {
      console.log(song.title);
      return this.createSong(song)});
    mediaPlayer.play(arrayMediaInfo, PlayStartModes.APPEND_QUEUE);
    this.handleModalBox(ModalBoxTypes.MODALBOX_SUCCESS, 'Songs added to queue.');
    setTimeout(()=>this.handleModalBox('', ''),2000)
  }

  inUpdate(bool) {
    this.setState({inUpdate : bool});
  }

  handleClickUpdate() {
    this.setState({pageUpdated : true});
  }

  infoCollectionUpdated(bool) {
    this.setState({pageUpdated : false});
    this.setState({inUpdate : false});
    if (bool)
      this.getCollection();
  }

  handleClickDelete() {
    let text = '';
    if(this.isRelease()) text = 'release?'; else text = 'playlist?';
    this.handleModalBox(ModalBoxTypes.MODALBOX_CONFIRM_DELETE, 'Do you really want to delete this ' + text);
  }

  handleConfirmDelete() {
    if(this.isRelease()) this.deleteReleasePage(); else this.deletePlaylistPage();
    this.handleModalBox('', '');
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

  deletePlaylistPage() {
    catalog.favorite('DELETE', 'personal_playlists', this.state.collection.id)
      .then(() => route('/library/me'))
      .catch( () => session.error = true);
  }

  render() {
    let modalBox = this.state.modalBox;
    let collection = this.state.collection;
    return (
      <div>
        {collection &&
        <div className={styles.collectionPage}>
          <div>
            <div className={styles.collectionInfo}>
              {this.isRelease()
              ? <ReleaseInfo
                  collection={collection}
                  inUpdate={this.state.inUpdate}
                  pageUpdated={this.state.pageUpdated}
                  infoCollectionUpdated={this.infoCollectionUpdated.bind(this)} />
              : <PlaylistInfo
                  collection={collection}
                  inUpdate={this.state.inUpdate}
                  pageUpdated={this.state.pageUpdated}
                  infoCollectionUpdated={this.infoCollectionUpdated.bind(this)}/>}
              <div>
                {!this.userLikeOwnPlaylist() &&
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
              collection={collection}
              isRelease={this.isRelease()}
            />
            {!this.state.inUpdate && (this.userLikeOwnPlaylist()  || this.userOwnRelease()) &&
              <button onClick={()=>this.inUpdate(true)}>Modify</button>}
            {this.state.inUpdate && (this.userLikeOwnPlaylist()  || this.userOwnRelease()) &&
              [<button onClick={this.handleClickDelete}>Delete</button>,
              <button onClick={()=>this.inUpdate(false)}>Cancel</button>,
              <button onClick={this.handleClickUpdate}>Update</button>]}
          </div>
          {modalBox.type &&
          <ModalBox
            type={modalBox.type}
            message={modalBox.message}
            handleCancel={()=>this.handleModalBox('', '')}
            handleSubmit={this.handleConfirmDelete}/>}
        </div>
        }
      </div>);
  }
}

export default CollectionPage;
