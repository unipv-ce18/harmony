import {updateSongInPlaylist, createPlaylist, patchPlaylist, getLibrary, setLike, execSearch} from './apiCalls';
import library from '../components/library/testLibrary';

const LIBRARY_STORE_KEY = 'library';

export class MediaCatalog {

  constructor(session) {
    this.session = session;
  }

  get #storeLibrary() {
    return JSON.parse(window.localStorage.getItem(LIBRARY_STORE_KEY));
  }

  set #storeLibrary(value) {
    if (value == null) window.localStorage.removeItem(LIBRARY_STORE_KEY);
    else window.localStorage.setItem(LIBRARY_STORE_KEY, JSON.stringify(value));
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
    let list, obj, bool = false;
    obj = {...this.#storeLibrary}
    if (media_type === 'songs') list = obj.songs;
    if (media_type === 'artists') list = obj.artists;
    if (media_type === 'releases') list = obj.releases;
    if (media_type === 'playlists') list = obj.playlists['others'];
    if (media_type === 'personal_playlists') list = obj.playlists['personal'];
    if (function_type === 'PUT' && !this.inLibrary(media_type, element_id)) {
      list.push(element_id);
      bool = true;
    }
    if (function_type === 'DELETE' && this.inLibrary(media_type, element_id)) {
      const index = list.indexOf(element_id);
      if (index > -1) list.splice(index, 1);
      bool = true;
    }
    if (bool) {
      this.#storeLibrary = obj;
      if (media_type === 'personal_playlists') media_type = 'playlists';
      return this.session.getAccessToken()
      .then (token => {
          return setLike(function_type, token, media_type, element_id)
            .then ((bool) => {return bool})
            .catch(e => console.log(e));
      })
    } else {
      return Promise.resolve(false);
    }
  }

  createPlaylist(playlist_name) {
    return this.session.getAccessToken()
      .then (token => {
        return createPlaylist(playlist_name, token)
          .then (data => {
            let list, obj;
            obj = {...this.#storeLibrary}
            let playlist_id = data['playlist_id'];
            list = obj.playlists['personal'];
            list.push(playlist_id);
            this.#storeLibrary = obj;
            return playlist_id;
          })
          .catch(e => console.log(e));
      })
  }

  patchPlaylist(playlist_id, patch) {
    return this.session.getAccessToken()
      .then (token => {
        return patchPlaylist(token, playlist_id, patch)
          .then (() => { })
          .catch(e => console.log(e));
      })
  }

  updateSongInPlaylist(type_method, playlist_id, song_id) {
    return this.session.getAccessToken()
      .then (token => {
          return updateSongInPlaylist(type_method, playlist_id, song_id, token);
      })
  }

  search(text, modifiers) {
    const searchType = convertModifiers(modifiers);
    // This will use client-side caching
    return this.session.getAccessToken()
      .then(token => execSearch(token, searchType, text));
  }
}

// TODO: Remove when the new server search API is implemented
function convertModifiers(modifiers) {
  return modifiers.findIndex(m => m.key === 'artists-only') !== -1 && 'artists' ||
    modifiers.findIndex(m => m.key === 'releases-only') !== -1 && 'releases' ||
    modifiers.findIndex(m => m.key === 'songs-only') !== -1 && 'songs' ||
    modifiers.findIndex(m => m.key === 'playlists-only') !== -1 && 'playlists' ||
    'any';
}

export const SearchTypes = Object.freeze({
  any: {name: 'All'},
  artists: {name: 'Artists'},
  releases: {name: 'Releases'},
  songs: {name: 'Songs'},
  playlists: {name: 'Playlists'}
});
