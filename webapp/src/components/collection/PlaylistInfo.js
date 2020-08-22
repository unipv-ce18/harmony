import {Component} from 'preact';
import {route} from 'preact-router';
import IconButton from '../IconButton';
import {
  IconLockClose,
  IconLockOpen,
  IconQueue,
  IconSettings,
  IconStarEmpty,
  IconStarFull
} from '../../assets/icons/icons';
import {catalog, session} from '../../Harmony';
import PlaylistImage from './PlaylistImage';
import styles from './CollectionInfo.scss';
import {patchPlaylist} from '../../core/apiCalls';
import CollectionSettingsModal from './CollectionSettingsModal';

class PlaylistInfo extends Component {

  constructor(props) {
    super(props);

    this.state = {
      inUpdate: false,
      settingsModal: false,
      settingsType: ''
    }

    this.clickCreator = this.clickCreator.bind(this);
    this.changePolicy = this.changePolicy.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClickUpdate = this.handleClickUpdate.bind(this);
  }

  componentDidMount() {
    this.setAttributesStates();
  }

  setAttributesStates(){
    this.setState({policy : this.props.collection.policy})
    this.setState({name : this.props.collection.name});
  }

  userLikeOwnPlaylist() {
    return catalog.inLibrary('personal_playlists', this.props.collection.id);
  }

  isUserOwner() {
    return session.currentUser?.id === this.props.collection.creator.id;
  }

  initialCollectionLikeState () {
    return catalog.inLibrary('playlists', this.props.collection.id);
  };

  likeCollection(function_type) {
    let media_type = 'playlists';
      if (function_type === 'PUT' && this.isUserOwner())
          media_type = 'personal_playlists';

      catalog.favorite(function_type, media_type, this.props.collection.id)
      this.setState({stateUpdated: true});
  }

  modifyPage(bool) {
    this.setState({inUpdate : bool});
    if(!bool) this.setAttributesStates();
  }

  handleSettingsModal(isOpen, type) {
    this.setState({settingsModal: isOpen});
    this.setState({settingsType: type});
  }


  clickCreator(e) {
    e.preventDefault();
    route('/user/' + this.props.collection.creator.id);
  }

  handleChange({target}) {
    this.setState({[target.name]: target.value});
  }

  changePolicy() {
    const policy = this.state.policy;
    catalog.patchPlaylist(this.props.collection.id, {policy})
      .then(()=> {
        if (policy === 'public') this.setState({policy : 'private'});
        else  this.setState({policy : 'public'});
      })
  }

  handleClickUpdate() {
    if ((this.state.name !== this.props.collection.name) && this.state.name !== '') {
      session.getAccessToken()
      .then (token => {
        patchPlaylist(token, this.props.collection.id, {name: this.state.name})
          .then( () => {
            this.props.infoCollectionUpdated();
          })
          .catch( () => session.error = true);
      })
    }
    this.setState({inUpdate: false});
  }

  deletePlaylistPage() {
    catalog.favorite('DELETE', 'personal_playlists', this.props.collection.id)
      .then(() => route('/library/me'))
      .catch( () => session.error = true);
  }


  render() {
    let collection = this.props.collection
    return (
      [<div class={styles.playlist}>
        <PlaylistImage images={collection.images}/>
        <div class={!this.state.inUpdate ? styles.playlistInfo : styles.playlistUpdatingInfo}>
          <p>Playlist</p>
          {!this.state.inUpdate
            ? <p>{collection.name}</p>
            : <p>
                <p>Playlist name:</p>
                <input type="text" name="name" value={this.state.name ? this.state.name : 'Playlist name'}
                       onChange={this.handleChange}/>
              </p>}
          <p><a href='#' onClick={this.clickCreator}>{collection.creator.username}</a></p>
          <p>{this.state.policy}
            {this.isUserOwner() &&
              <IconButton
                size={22}
                name={this.state.policy === 'public' ? "Make it private" : "Make it public"}
                icon={this.state.policy === 'public' ? IconLockOpen : IconLockClose}
                onClick={this.changePolicy}/>}
          </p>
        </div>
      </div>,
      <div>
        {this.state.inUpdate ?
        <div>
          <button onClick={()=>this.modifyPage(false)}>Cancel</button>
          <button onClick={this.handleClickUpdate}>Update</button>
        </div>
        :
        <div>
        {this.userLikeOwnPlaylist() ?
          <IconButton size={24} name="Settings" icon={IconSettings}
              onClick={this.handleSettingsModal.bind(this, true)}/>
        :
        (this.initialCollectionLikeState()
          ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                        onClick={this.likeCollection.bind(this, 'DELETE')}/>
          : <IconButton size={24} name="Like" icon={IconStarEmpty}
                        onClick={this.likeCollection.bind(this, 'PUT')}/>)}
          <IconButton
            size={22}
            name={"Add To Queue"}
            icon={IconQueue}
            onClick={()=>this.props.addSongsToQueue()}/>
        </div>}
      </div>,
      this.state.settingsModal &&
          <CollectionSettingsModal
            handleSettingsModal={this.handleSettingsModal.bind(this)}
            type={'playlist'}
            modifyPage={this.modifyPage.bind(this)}
            removeCollection={this.deletePlaylistPage.bind(this)}/>]
    );
  }
}

export default PlaylistInfo;
