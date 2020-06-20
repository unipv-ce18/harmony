import {Component} from 'preact';

import library from './testLibrary';
import styles from './LibraryPage.scss';

import {catalog} from '../../Harmony';
import {route} from 'preact-router';
import image from '../collection/image.jpg';

class ArtistsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked : true,
      artists: [...this.props.artists]
    };

    this.clickArtist = this.clickArtist.bind(this);
  }

  clickArtist(id) {
  }

  render() {
    return (
      <div className={styles.libraryArtists}>
          {this.state.clicked && this.state.artists.map(item =>
              <span>
                <img src={image} alt={""}/>
                <p><a href='' onClick={()=>this.clickArtist(item.artist.id)}>{item.artist.name}</a></p>
              </span>)}
      </div>
    );
  }
}
export default ArtistsPage;
