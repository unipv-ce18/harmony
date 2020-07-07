import {Component} from 'preact';

import {getReleasePlaylist} from "../../core/apiCalls";
import {catalog, mediaPlayer, session} from "../../Harmony"
import styles from './CollectionPage.scss';
import CollectionSongsTable from './CollectionSongsTable';
import ModalBox from './ModalBox';
import IconButton from '../IconButton';
import {IconPause, IconPlay, IconStarEmpty, IconStarFull} from '../../assets/icons/icons';
import {route} from 'preact-router';
import {createMediaItemInfo} from '../../core/links';
import {MediaItemInfo, PlayStartModes} from '../../player/MediaPlayer';
import PlaylistImage from './PlaylistImage';

const MODALBOX_PLAYLIST_DELETE = 'modalbox_playlist_delete';

class CollectionPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      userPlaylists: {},
      collectionType: '',
      modalBox : {type:'', message:''},
      songPlayed : '',
      stateUpdated : true
    }

    this.clickCreator = this.clickCreator.bind(this);
    this.playRelease = this.playRelease.bind(this)
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
    this.isRelease()
      ? route('/artist/' + this.state.collection.artist.id)
      : route('/library/' + this.state.collection.creator.id);
  }

  isRelease() {
    return this.state.collectionType === 'releases';
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

  playRelease() {
    let arrayMediaInfo = this.state.collection.songs.map(song => {
      return this.createSong(song)});

    mediaPlayer.play(arrayMediaInfo, PlayStartModes.APPEND_QUEUE_AND_PLAY);
  }

  playedSongInCollection() {
    return this.state.collection.songs.map(song => {return song.id}).includes(this.state.songPlayed);
  }

  render() {
    return (
      <div>
        {this.state.collection &&
        <div className={styles.collectionPage}>
          <div>
            <div className={styles.collectionInfo}>
              {this.isRelease() ? <div><img src={this.state.collection.cover} alt={""}/></div> :
                <PlaylistImage playlist={this.state.collection}/>
              }
              <div>
                <p>{this.isRelease() ? this.state.collection.type : 'Playlist'}</p>
                <p>{this.state.collection.name}</p>
                <p><a href='#' onClick={this.clickCreator}>
                    {this.isRelease() ? this.state.collection.artist.name : this.state.collection.creator.username}
                  </a></p>
                <p>{this.isRelease() ? this.state.collection.date : this.state.collection['policy']}</p>
              </div>
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
                    name={this.playedSongInCollection() ? "Pause" : "Play"}
                    icon={this.playedSongInCollection() ? IconPause : IconPlay}
                    onClick={this.playedSongInCollection()
                      ? () => mediaPlayer.pause()
                      : this.playRelease}/>
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
