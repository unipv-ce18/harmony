import {Component} from 'preact';
import styles from './ArtistPage.scss';
import SettingsModal from '../SettingsModal'
import Tags from './Tags';
import Links from './Links';
import IconButton from '../IconButton';
import {IconStarEmpty, IconStarFull, IconSettings} from '../../assets/icons/icons';
import {catalog, session} from '../../Harmony';
import {deleteArtist} from '../../core/apiCalls';

class ArtistInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      additional: false,
      stateUpdated: true,
      settingsModal: {open: false}
    };

    this.handleAdditional = this.handleAdditional.bind(this);
  }

  handleAdditional() {
    this.setState( prevState => ({ additional: !prevState.additional}));
  }

  initialArtistLikeState () {
    return catalog.inLibrary('artists', this.props.artist.id);
  };

  likeArtist(function_type) {
      catalog.favorite(function_type, 'artists', this.props.artist.id)
      this.setState({stateUpdated: true});
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.artist.creator;
  }

  deleteArtistPage() {
    session.getAccessToken()
      .then (token => {
        deleteArtist(this.props.artist.id, token)
          .then(result => {
            route('/user/' + session.getOwnData().id);
          })
          .catch( () => session.error = true);
      })
  }

  handleSettingsModal(isOpen, e) {
    e.preventDefault();
    this.setState({settingsModal: {open: isOpen}});
  }

  render() {
    const artist = this.props.artist;

    return(
      <div class={styles.artistInfo}>
        <div>
          <h2 class={styles.name}>{artist.name}</h2>
          {this.state.stateUpdated && this.initialArtistLikeState()
            ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                          onClick={this.likeArtist.bind(this, 'DELETE')}/>
            : <IconButton size={24} name="Like" icon={IconStarEmpty}
                          onClick={this.likeArtist.bind(this, 'PUT')}/>}&nbsp;
          {this.isUserOwner() &&
            <IconButton size={24} name="Settings" icon={IconSettings}
                        onClick={this.handleSettingsModal.bind(this, true)}/>}
        </div>
        {artist.genres ? <Tags list = {artist.genres}/> : null}
        {artist.bio ?
          artist.bio.split(' ').length > 50 && !this.state.additional
            ? <div className={styles.artistBio}>{artist.bio.split(' ').slice(0, 50).join(' ') + '...'}</div>
            : <div className={styles.artistBio}>{artist.bio}</div> : null}
        {this.state.additional &&
          <div className={styles.additionalInfo}>
            {artist.life_span &&
            <span>
              {artist.life_span.begin} - {artist.life_span.end === null ? "Still Active" : artist.life_span.end}
            </span>}
            {artist.members && artist.members.length > 1 &&
            <ul>
              {artist.members.map(item => <li className={styles.member}>{item.name} - {item.role}</li>)}
            </ul>}
              {artist.links && Object.keys(artist.links).length > 0 ? <Links links = {artist.links}/> : null}
          </div>
        }
        <span><button onClick={this.handleAdditional}>{this.state.additional ? 'Read less' : 'Read more'} </button></span>
        <SettingsModal
          handleSettingsModal={this.handleSettingsModal.bind(this)}
          open={this.state.settingsModal.open}
          type="artist"
          removeArtist={this.deleteArtistPage.bind(this)}/>
      </div>
    );
  }
}

export default ArtistInfo;
