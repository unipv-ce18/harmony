import {Component} from 'preact';
import styles from './ArtistPage.scss';
import Tags from './Tags';
import Links from './Links';
import IconButton from '../IconButton';
import {IconStarEmpty, IconStarFull} from '../../assets/icons/icons';
import {catalog, session} from '../../Harmony';

class ArtistInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      additional: false,
      stateUpdated: true
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
                          onClick={this.likeArtist.bind(this, 'PUT')}/>}
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
              {artist.members.map(item => <li className={styles.member}>{item.name} - {item.role}</li>)}}
            </ul>}
              {artist.links && Object.keys(artist.links).length > 0 ? <Links links = {artist.links}/> : null}
          </div>
        }
        <span><button onClick={this.handleAdditional}>{this.state.additional ? 'Read less' : 'Read more'} </button></span>
      </div>
    );
  }
}

export default ArtistInfo;
