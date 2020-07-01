import {updateSongInPlaylist, createPlaylist, getLibrary, setLike} from "./apiCalls";
import library from '../components/library/testLibrary';

const LIBRARY_STORE_KEY = 'library';

export class MediaCatalog {

  #libraryCache = undefined;

  constructor(session) {
    this.session = session;
  }

  get #storeLibrary() {
    if (this.#libraryCache === undefined)
      this.#libraryCache = JSON.parse(window.localStorage.getItem(LIBRARY_STORE_KEY));
    return this.#libraryCache;
  }

  set #storeLibrary(value) {
    this.#libraryCache = value;
    if (value == null) {
      window.localStorage.removeItem(LIBRARY_STORE_KEY);
    }
    else {
      window.localStorage.setItem(LIBRARY_STORE_KEY, JSON.stringify(value));
    }
  }

  /**
   * Attempts to perform login with the API
   *
   * This will fail if the user is already logged in (i.e. loggedIn is true), credentials are invalid
   * or a server error occurs.
   *
   */
  setCachedLibrary() {
    return this.session.getAccessToken()
      .then (token => {
        getLibrary('me', token, false)
          .then (library => this.#storeLibrary = library)
          .catch(e => console.log(e));
      })
  }

  getFullLibrary(user_id) {
    return this.session.getAccessToken()
      .then (token => {
        return getLibrary(user_id, token, true)
          .catch(e => console.log(e));
      })
  }

  inLibrary(media_type, element_id) {
    if (media_type === 'songs') return this.#storeLibrary.songs.includes(element_id);
    if (media_type === 'artists') return this.#storeLibrary.artists.includes(element_id);
    if (media_type === 'releases') return this.#storeLibrary.releases.includes(element_id);
    if (media_type === 'playlists') {
      return this.#storeLibrary.playlists['others'].includes(element_id);
    }
    if (media_type === 'personal_playlists') {
      return this.#storeLibrary.playlists['personal'].includes(element_id);
    }
    return false;
  }

  favorite(function_type, media_type, element_id) {
    let elem, bool = false;
    if (media_type === 'songs') elem = this.#libraryCache.songs;
    if (media_type === 'artists') elem = this.#libraryCache.artists;
    if (media_type === 'releases') elem = this.#libraryCache.releases;
    if (media_type === 'playlists') elem = this.#libraryCache.playlists['others'];
    if (media_type === 'personal_playlists') elem = this.#libraryCache.playlists['personal'];
    if (function_type === 'PUT' && !this.inLibrary(media_type, element_id)) {
      elem.push(element_id);
      bool = true;
    }
    if (function_type === 'DELETE' && this.inLibrary(media_type, element_id)) {
      const index = elem.indexOf(element_id);
      if (index > -1) elem.splice(index, 1);
      bool = true;
    }
    if (bool) {
      this.#storeLibrary = this.#libraryCache;
      if (media_type === 'personal_playlists') media_type = 'playlists';
      return this.session.getAccessToken()
      .then (token => {
          return setLike(function_type, token, media_type, element_id)
            .then ((bool) => {return bool})
            .catch(e => console.log(e));
      })
    }
  }

  createPlaylist(playlist_name) {
    return this.session.getAccessToken()
      .then (token => {
          return createPlaylist(playlist_name, token)
            .then (data => {
              const playlist_id = data['playlist_id'];
              this.#libraryCache.playlists['personal'].push(playlist_id);
              this.#storeLibrary = this.#libraryCache;
              return playlist_id;
            })
            .catch(e => console.log(e));
      })
  }

  updateSongInPlaylist(type_method, playlist_id, song_id) {
    return this.session.getAccessToken()
      .then (token => {
          return updateSongInPlaylist(type_method, playlist_id, song_id, token);
      })
  }
}
