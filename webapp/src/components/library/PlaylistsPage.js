import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {route} from 'preact-router';
import image from '../collection/image.jpg';

class PlaylistsPage extends Component {
   constructor(props) {
    super(props);

    this.state = {
      playlists: {...this.props.playlists}
    };
  }

  clickPlaylist(playlist_id, e) {
     e.preventDefault();
     route('/playlist/' + playlist_id);
  }

  clickCreator(creator_id, e) {
     e.preventDefault();
     route('/library/' + creator_id);
  }

  render() {
    return (
      <div className={styles.libraryCommon}>
        {Object.entries(this.state.playlists).map(([type, arrays]) =>
          <div>
            {type === 'personal' && arrays.length > 0 && <div>Realized by you</div>}
            {type === 'others' && arrays.length > 0 && <div>Playlists you like</div>}
            {
            Object.values(arrays).map(playlist =>
            <span>
              <img src={image} alt={""}/>
              <p><a href='#' onClick={this.clickPlaylist.bind(this, playlist.id)}>{playlist.name}</a></p>
              <p>By <a href='#' onClick={this.clickCreator.bind(this, playlist.creator.id)}>{playlist.creator.username}</a>
              </p>
            </span>)}
          </div>
          )}
      </div>
    );
  }
}
export default PlaylistsPage;
