import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {route} from 'preact-router';
import {DEFAULT_ALBUMART_URL} from '../../assets/defaults';

class ArtistsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked : true,
    };
  }

  clickArtist(artist_id, event) {
    event.preventDefault();
    route('/artist/' + artist_id);
  }

  render() {
    return (
      <div>
        { this.props.artists.length > 0 &&
          <div className={styles.libraryArtists}>
            {this.props.artists.map(artist =>
              <span>
                <a href='#' onClick={this.clickArtist.bind(this, artist.id)}>
                  <img src={artist.image? artist.image : DEFAULT_ALBUMART_URL} alt={""}/>
                </a>
                <p><a href='#' onClick={this.clickArtist.bind(this, artist.id)}>
                  {artist.name}
                </a></p>
              </span>)}
          </div>
        }
      </div>
    );
  }
}
export default ArtistsPage;
