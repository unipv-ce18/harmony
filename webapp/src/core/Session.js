import {execLogin, execRefresh, getUserInfo} from './apiCalls';
import {execLogout} from './apiCalls';
import {getCurrentTime} from './utils'

import {catalog, session} from '../Harmony';

const SESSION_STORE_KEY = 'session';
const USER_STORE_KEY = 'user_info';

export class Session {

  #listeners = [];
  #notifyListeners = e => this.#listeners.forEach(l => l(e));

  #storeCache = undefined;

  /**
   * @return {
   *   {token: string, expiration: number, refreshToken: string, refreshExpiration: number} | null
   * } The current session store
   */
  get #store() {
    if (this.#storeCache === undefined)
      this.#storeCache = JSON.parse(window.localStorage.getItem(SESSION_STORE_KEY));
    return this.#storeCache;
  }

  /**
   * @param {
   *   {token: string, expiration: number, refreshToken: string, refreshExpiration: number} | null
   * } value - The new session store or `null` to unset
   */
  set #store(value) {
    this.#storeCache = value;
    if (value == null) {
      window.localStorage.removeItem(SESSION_STORE_KEY);
    }
    else {
      window.localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(value));
    }
    this.#notifyListeners();
  }

  set #userInfo(value) {
    if (value == null) {
      window.localStorage.removeItem(USER_STORE_KEY);
    }
    else {
      window.localStorage.setItem(USER_STORE_KEY, JSON.stringify(value));
    }
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

  set error(bool) {
      if(bool) {
        window.localStorage.setItem('error', JSON.stringify(true));
        this.#notifyListeners();
      }
      else {
        window.localStorage.removeItem('error');
      }
  }
  get error() {
    return window.localStorage.getItem('error') !== null
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
   */
  get valid() {
    return (this.#store !== null && this.#store.expiration > getCurrentTime())
  }

  getAccessToken() {
    if (this.#store !== null && this.#store.expiration > getCurrentTime()) {
      return Promise.resolve(this.#store.token);
    }
    if (this.#store !== null && this.#store.refreshExpiration > getCurrentTime()) {
      return execRefresh(this.#store.refreshToken)
        .then(data => {
          const token = data['access_token'];
          const expiration = getCurrentTime() + parseInt(data['expires_in']);
          if (token == null || isNaN(expiration))
            throw new Error('Invalid server response');
          this.#store = {...this.#store, token, expiration};
          return token;
        })
        .catch(e => {
          console.error(e);
        });
    }
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
        const accessToken = data['access_token'];
        const refreshToken = data['refresh_token'];
        const accessExpiration = getCurrentTime() + parseInt(data['expires_in']);
        const refreshExpiration = getCurrentTime() + parseInt(data['refresh_expires_in']);
        if (data['token_type'] !== 'bearer' || accessToken == null || isNaN(accessExpiration) || refreshToken == null || isNaN(refreshExpiration))
          throw Error('Invalid server response');
        this.#store = {token: accessToken, expiration: accessExpiration, refreshToken, refreshExpiration};
        catalog.setCachedLibrary();
        //catalog.setCachedPlaylists();

        getUserInfo(accessToken,'me')
          .then(user_data => {
            this.#userInfo = {user_data: user_data}
          })
      });
  }

  /**
   * Performs a logout and erases the saved session storage
   */
  doLogout() {
    if (!this.loggedIn) return;
    this.getAccessToken()
      .then(token => execLogout(token));
    this.#store = null;
  }

  getOwnData() {
    if (window.localStorage.getItem(USER_STORE_KEY))
      return JSON.parse(window.localStorage.getItem(USER_STORE_KEY)).user_data;
    return false;
  }

  /**
   * Notify that this session (token) is no longer valid
   *
   * This method should be usually called after failed API calls due to HTTP 401 Unauthorized responses.
   */
  notifyInvalid() {
    this.#notifyListeners();
  }

  toString() {
    return `Session(loggedIn: ${this.loggedIn}, valid: ${this.valid}, online: ${this.online})`;
  }
}
