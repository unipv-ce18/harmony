import {mediaPlayer, session} from '../../Harmony';
import HarmonyPage from '../HarmonyPage';
import {getReleasePlaylist} from '../../core/apiCalls';
import CollectionSongsTable from './CollectionSongsTable';
import {createMediaItemInfo} from '../../core/links';
import {PlayStartModes} from '../../player/MediaPlayer';
import ReleaseInfo from './ReleaseInfo';
import PlaylistInfo from './PlaylistInfo';
import ModalBox, {ModalBoxTypes} from '../modalbox/ModalBox';

import styles from './CollectionPage.scss';

class CollectionPage extends HarmonyPage {

  constructor(props) {
    super(props);

    this.state = {
      modalBox: {type:'', message:''},
      userPlaylists: {},
      collectionType: '',
      songPlayed : '',
      playlistPolicy : '',
      settingsModal: false
    }

    this.infoCollectionUpdated = this.infoCollectionUpdated.bind(this);
    this.addSongsToQueue = this.addSongsToQueue.bind(this);
  }

  componentDidMount() {
    this.getCollection();
  }

  componentDidUpdate(prevProps, prevStates) {
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

  isRelease() {
    return this.state.collectionType === 'releases';
  }

  infoCollectionUpdated() {
    this.getCollection();
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  createSong(song) {
    return createMediaItemInfo(song, this.isRelease() ? this.state.collection : null);
  }

  addSongsToQueue() {
    let arrayMediaInfo = this.state.collection.songs.map(song => {
      return this.createSong(song)});
    mediaPlayer.play(arrayMediaInfo, PlayStartModes.APPEND_QUEUE);
    this.handleModalBox(ModalBoxTypes.MODALBOX_SUCCESS, 'Songs added to queue.');
    setTimeout(()=>this.handleModalBox('', ''),2000)
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
                  infoCollectionUpdated={this.infoCollectionUpdated}
                  addSongsToQueue={this.addSongsToQueue} />
              : <PlaylistInfo
                  collection={collection}
                  infoCollectionUpdated={this.infoCollectionUpdated}
                  addSongsToQueue={this.addSongsToQueue}/>}
            <hr/>
            </div>
            <CollectionSongsTable
              collection={collection}
              isRelease={this.isRelease()}/>
          </div>
        </div>}
        {modalBox.type &&
          <ModalBox
            type={modalBox.type}
            message={modalBox.message}
            />}
      </div>);
  }
}

export default CollectionPage;
