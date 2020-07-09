import {Component} from 'preact';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen} from '../../assets/icons/icons';
import {route} from 'preact-router';
import {catalog} from '../../Harmony';
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
    route('/library/' + this.state.collection.creator.id);
  }

  changePolicy() {
    catalog.updateSongInPlaylist('PATCH', this.state.collection.id)
      .then(()=> {
        let collection = {...this.state.collection};
        collection['policy'] = this.state.collection.policy === 'public'? 'private' : 'public' ;
        this.setState({collection : collection});
        this.setState({stateUpdated : true})
        console.log(this.state.collection);
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
          <p>{
            [this.state.policy,
              <IconButton
                size={22}
                name={this.state.policy === 'public' ? "Make it private" : "Make it public"}
                icon={this.state.policy === 'public' ? IconLockOpen : IconLockClose}
                onClick={this.changePolicy}/>]}
          </p>
        </div>
      </div>
    );
  }
}

export default PlaylistInfo;
