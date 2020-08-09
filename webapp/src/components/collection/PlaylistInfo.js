import {Component} from 'preact';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen} from '../../assets/icons/icons';
import {route} from 'preact-router';
import {catalog, session} from '../../Harmony';
import PlaylistImage from './PlaylistImage';
import styles from './CollectionInfo.scss';

class PlaylistInfo extends Component {

  constructor(props) {
    super(props);

    this.state = {
      name : ""
    }

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
    let name=null;
    if ((this.state.name !== this.props.name) && this.state.name !== '') name = this.state.name;
    this.props.updatePlaylistInfo(name);
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
                <p>Change name:</p>
                <input type="text" value={collection.name ? collection.name : 'Playlist name'}/>
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
