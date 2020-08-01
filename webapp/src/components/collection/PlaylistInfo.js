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
    catalog.updateSongInPlaylist('PATCH', this.props.collection.id)
      .then(()=> {
        const policy = this.state.policy;
        if (policy === 'public') this.setState({policy : 'private'});
        else  this.setState({policy : 'public'});
      })
  }

  render() {
    return (
      <div>
        <PlaylistImage images={this.props.collection.images}/>
        <div>
          <p>Playlist</p>
          <p>{this.props.collection.name}</p>
          <p><a href='#' onClick={this.clickCreator}>{this.props.collection.creator.username}</a></p>
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
