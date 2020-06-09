import {Component} from 'preact';

import library from './testLibrary';
import styles from './LibraryPage.scss';

import {catalog} from '../../Harmony';
import {route} from 'preact-router';
import image from '../release/image.jpg';

class PlaylistsPage extends Component {
   constructor(props) {
    super(props);

    this.state = {
      clicked : true,
      playlists: [...this.props.playlists]
    };

    this.clickArtist = this.clickArtist.bind(this);
    this.clickRelease = this.clickRelease.bind(this);
  }

  clickArtist(id) {
  }

  clickRelease(id) {
    route('/release/' + id);
  }

  render() {
    return (
      <div className={styles.libraryCommon}>
          {this.state.clicked && this.state.playlists.map(item =>
              <span>
                <img src={image} alt={""}/>
                <p><a href='' onClick={()=>this.clickRelease(item.id)}>{item.name}</a></p>
                <p>By <a href='' onClick={()=>this.clickArtist(item.artist.id)}>{item.artist.name}</a></p>
              </span>)}
      </div>
    );
  }
}
export default PlaylistsPage;
