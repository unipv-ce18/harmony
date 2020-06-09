import {execLogin, execRefresh, getLibrary, setLike} from "./apiCalls";
import library from '../components/library/testLibrary';
import {session} from '../Harmony';


const LIBRARY_STORE_KEY = 'library';

export class MediaCatalog {

  #libraryCache = undefined;

  constructor(session) {
    this.session = session;
  }

  get #store() {
    if (this.#libraryCache === undefined)
      this.#libraryCache = JSON.parse(window.localStorage.getItem(LIBRARY_STORE_KEY));
    return this.#libraryCache;
  }

  set #store(value) {
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
    let token = this.session.getAccessToken();
    return getLibrary('me', token, false)
      .then(data => {
        this.#store = data;
      });
  }

  getFullLibrary(user_id) {
    let token = this.session.getAccessToken();
    console.log("getFullLibrary")
    console.log(token)
    return getLibrary(user_id, token, true)
      .catch(e => console.log(e));
  }

  inLibrary(media_type, element_id) {
    if (media_type === 'songs') return this.#store.songs.includes(element_id);
    if (media_type === 'artists') return this.#store.artists.includes(element_id);
    if (media_type === 'releases') {
      return this.#store.releases.includes(element_id);
    }
    return false;
  }

  favorite(function_type, media_type, element_id) {
    let elem, bool = false;
    if (media_type === 'songs') elem = this.#libraryCache.songs;
    if (media_type === 'artists') elem = this.#libraryCache.artists;
    if (media_type === 'releases') elem = this.#libraryCache.releases;
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
      this.#store = this.#libraryCache;
      setLike(function_type, session.getAccessToken(), media_type, element_id)
        .catch(e => console.log(e));
    }
  }
}
