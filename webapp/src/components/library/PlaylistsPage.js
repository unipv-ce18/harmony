import {Component} from 'preact';

import styles from './LibraryPage.scss';

import {route} from 'preact-router';
import image from '../collection/image.jpg';
import {session} from '../../Harmony';

class PlaylistsPage extends Component {
   constructor(props) {
     super(props);
   }

  clickPlaylist(playlist_id, e) {
     e.preventDefault();
     route('/playlist/' + playlist_id);
  }

  clickCreator(creator_id, e) {
     e.preventDefault();
     route('/library/' + creator_id);
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.user.id;
  }

  render() {
    return (
      <div className={styles.libraryCommon}>
        {Object.entries(this.props.playlists).map(([type, arrays]) =>
          <div>
            {this.isUserOwner() ?
              <div>
                {type === 'personal' && arrays.length > 0 && <p>Realized by you</p>}
                {type === 'others' && arrays.length > 0 && <p>Playlists you like</p>}
              </div>
              :
              <div>
                {type === 'personal' && <p>Playlists {this.props.user.username} likes</p>}
              </div>}
            {
            Object.values(arrays).map(playlist =>
            <span>
              <a href='#' onClick={this.clickPlaylist.bind(this, playlist.id)}><img src={image} alt={""}/></a>
              <p><a href='#' onClick={this.clickPlaylist.bind(this, playlist.id)}>{playlist.name}</a></p>
              {(type === 'others' || !this.isUserOwner()) &&
              <p>By <a href='#' onClick={this.clickCreator.bind(this, playlist.creator.id)}>{playlist.creator.username}</a>
              </p>}
            </span>)}
          </div>
          )}
      </div>
    );
  }
}
export default PlaylistsPage;
