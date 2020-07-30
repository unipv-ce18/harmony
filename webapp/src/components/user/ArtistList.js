import {Component} from 'preact';
import {route} from 'preact-router';
import styles from './UserPage.scss';

class ArtistList extends Component {
  constructor(props) {
    super(props);
  }

  handleClickArtist(artist_id, e) {
    e.preventDefault();
    route('/artist/' + artist_id);
  }

  render() {
    return(
      <div class={styles.artistList}>
        {this.props.artists.map(artist =>
          <div class={styles.artist}>
            <a href='#' onClick={this.handleClickArtist.bind(this, artist.id)}>
              <img src={artist.image ? artist.image : null} alt={artist.name}/>
            </a>
            <p><a href='#' onClick={this.handleClickArtist.bind(this, artist.id)}>{artist.name}</a></p>
          </div>)
        }
      </div>
    );
  }
}

export default ArtistList;
