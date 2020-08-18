import {Component} from 'preact';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen} from '../../assets/icons/icons';
import {route} from 'preact-router';
import {catalog, session} from '../../Harmony';
import PlaylistImage from './PlaylistImage';
import styles from './CollectionInfo.scss';
import {patchPlaylist} from '../../core/apiCalls';

class PlaylistInfo extends Component {

  constructor(props) {
    super(props);

    this.clickCreator = this.clickCreator.bind(this);
    this.changePolicy = this.changePolicy.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.setState({policy : this.props.collection.policy})
    this.setState({name : this.props.collection.name});
  }

  componentDidUpdate(prevProps) {
    if(this.props.pageUpdated && !prevProps.pageUpdated) {
      this.handleUpdate();
    }
  }

  clickCreator(e) {
    e.preventDefault();
    route('/user/' + this.props.collection.creator.id);
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.collection.creator.id;
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

  handleUpdate() {
    if ((this.state.name !== this.props.collection.name) && this.state.name !== '') {
      session.getAccessToken()
      .then (token => {
        patchPlaylist(token, this.props.collection.id, {name: this.state.name})
          .then( () => {
            this.props.infoCollectionUpdated(true);
          })
          .catch( () => session.error = true);
      })
    }
    else this.props.infoCollectionUpdated(false);
  }


  render() {
    let collection = this.props.collection
    return (
      <div class={styles.playlist}>
        <PlaylistImage images={collection.images}/>
        <div class={!this.props.inUpdate ? styles.playlistInfo : styles.playlistUpdatingInfo}>
          <p>Playlist</p>
          {!this.props.inUpdate
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
      </div>
    );
  }
}

export default PlaylistInfo;
