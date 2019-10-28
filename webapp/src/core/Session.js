import {execLogin} from './apiCalls';
import {getCurrentTime} from './utils'

const SESSION_STORE_KEY = 'session';

export class Session {

  #validHint = false;
  #listeners = [];
  #notifyListeners = e => this.#listeners.forEach(l => l(e));

  #storeCache = undefined;

  get #store() {
    if (this.#storeCache === undefined)
      this.#storeCache = JSON.parse(window.localStorage.getItem(SESSION_STORE_KEY));
    return this.#storeCache;
  }

  set #store(value) {
    this.#storeCache = value;
    if (value == null)
      window.localStorage.removeItem(SESSION_STORE_KEY);
    else {
      window.localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(value));
      this.#validHint = true;
    }
    this.#notifyListeners();
  }

  constructor() {
    window.addEventListener('online', this.#notifyListeners);
    window.addEventListener('offline', this.#notifyListeners);
  }

  /**
   * Indicates whenever there is a user associated to this session
   *
   * @returns {boolean} True if the user is currently logged in
   */
  get loggedIn() {
    return this.#store !== null && this.#store.token !== null;
  }

  /**
   * Reports about the current network status of the web application
   *
   * @returns {boolean} True if the browser is online
   */
  get online() {
    return navigator.onLine;
  }

  /**
   * Tells if the token associated to this session is still valid to access the API
   *
   * @returns {boolean} True if this session is still valid
   */
  get valid() {
    if (this.#validHint === false) return false;
    return this.#store !== null && this.#store.expiration > getCurrentTime();
  }

  /**
   * Adds a new listener that will be called when the status of this session changes.
   *
   * Listeners are called when a change occurs in login status, browser online status or a call to notifyInvalid()
   * is made signaling invalidation of the session. Listeners are not invoked when a session regularly by timeout.
   *
   * @param {function} listener The new listener
   */
  addStatusListener(listener) {
    this.#listeners.push(listener);
  }

  /**
   * Attempts to perform login with the API
   *
   * This will fail if the user is already logged in (i.e. loggedIn is true), credentials are invalid
   * or a server error occurs.
   *
   * @param {string} username The username to log in as
   * @param {string} password The password for the user
   * @returns {Promise<any>} A promise that resolves once authentication completes
   */
  doLogin(username, password) {
    if (this.loggedIn)
      throw Error('User already logged in');

    return execLogin(username, password)
      .then(data => {
        const token = data['access_token'];
        const expiration = parseInt(data['expires_in']);
        if (data['token_type'] !== 'bearer' || token == null || isNaN(expiration))
          throw Error('Invalid server response');
        this.#store = {token, expiration};
      });
  }

  /**
   * Performs a logout and erases the saved session storage
   */
  doLogout() {
    if (this.valid) {
      // TODO: actually log out on the server
    }
    this.#store = null;
  }

  /**
   * Notify that this session (token) is no longer valid
   *
   * This method should be usually called after failed API calls due to HTTP 401 Unauthorized responses.
   */
  notifyInvalid() {
    this.#validHint = false;
    this.#notifyListeners();
  }

  toString() {
    return `Session(loggedIn: ${this.loggedIn}, valid: ${this.valid}, online: ${this.online})`;
  }

}
