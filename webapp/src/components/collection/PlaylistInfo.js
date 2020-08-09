import {Component} from 'preact';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen} from '../../assets/icons/icons';
import {route} from 'preact-router';
import {catalog, session} from '../../Harmony';
import PlaylistImage from './PlaylistImage';

class PlaylistInfo extends Component {

  constructor(props) {
    super(props);

    this.clickCreator = this.clickCreator.bind(this);
    this.changePolicy = this.changePolicy.bind(this)
  }

  componentDidMount() {
    this.setState({policy : this.props.collection.policy})
  }

  clickCreator(e) {
    e.preventDefault();
    route('/user/' + this.props.collection.creator.id);
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.collection.creator.id;
  }

  changePolicy() {
    const policy = this.state.policy;
    catalog.patchPlaylist(this.props.collection.id, {policy})
      .then(()=> {
        if (policy === 'public') this.setState({policy : 'private'});
        else  this.setState({policy : 'public'});
      })
  }

  render() {
    let collection = this.props.collection
    return (
      <div>
        <PlaylistImage images={collection.images}/>
        <div>
          <p>Playlist</p>
          <p>{collection.name}</p>
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
