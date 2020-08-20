import {AccessToken, RefreshToken, execLogin, execRefresh} from './apiCalls';
import {execLogout} from './apiCalls';
import {getCurrentTime} from './utils'

import {fetchUser, User} from './User';

const CURRENT_USER_ID = 'me';

const SESSION_STORE_KEY = 'session';
const USER_STORE_KEY = 'user_info';

type SessionStore = {
    token: AccessToken
    expiration: number,
    refreshToken: RefreshToken,
    refreshExpiration: number
};

export class Session {

    private readonly listeners: Array<Function> = [];
    private readonly notifyListeners = (...args: any[]) => this.listeners.forEach(l => l(...args));

    private storeCache?: SessionStore = undefined;
    private currentUserCache?: User = undefined;

    constructor() {
        window.addEventListener('online', this.notifyListeners);
        window.addEventListener('offline', this.notifyListeners);
    }

    /**
     * Indicates whenever there is a user associated to this session
     *
     * @returns {boolean} True if the user is currently logged in
     */
    get loggedIn() {
        return this.store?.token !== undefined;
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
     */
    get valid() {
        return this.store !== undefined && this.store.expiration > getCurrentTime();
    }

    /**
     * Tells if the refresh tokem associated to this session is still valid
     */
    get refreshValid() {
        return this.store !== undefined && this.store.refreshExpiration > getCurrentTime();
    }

    getAccessToken(): Promise<AccessToken | null> {
        if (this.valid)
            return Promise.resolve(this.store!.token)

        if (this.refreshValid) {
            return execRefresh(this.store!.refreshToken).then(data => {
                const token = data.access_token;
                const expiration = getCurrentTime() + data.expires_in;
                if (token == null || isNaN(expiration))
                    throw new Error('Invalid server response');
                this.store = {...this.store!, token, expiration};
                return token;
            })
        }

        return Promise.resolve(null);  // If not logged in
    }

    private get store() {
      if (this.storeCache === undefined)
        this.storeCache = JSON.parse(window.localStorage.getItem(SESSION_STORE_KEY)!);
      return this.storeCache;
    }

    private set store(value) {
        this.storeCache = value;
        if (value == null)
            window.localStorage.removeItem(SESSION_STORE_KEY);
        else
            window.localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(value));
        this.notifyListeners();
    }

    public get currentUser() {
        if (this.currentUserCache === undefined) {
            const userStore = window.localStorage.getItem(USER_STORE_KEY);
            if (userStore != null)
                this.currentUserCache = new User(this, CURRENT_USER_ID, JSON.parse(userStore).user_data)
        }
        return this.currentUserCache;
    }

    /**
     * Adds a new listener that will be called when the status of this session changes.
     *
     * Listeners are called when a change occurs in login status, browser online status or a call to notifyInvalid()
     * is made signaling invalidation of the session. Listeners are not invoked when a session regularly by timeout.
     *
     * @param {function} listener The new listener
     */
    addStatusListener(listener: Function) {
        this.listeners.push(listener);
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
    doLogin(username: string, password: string) {
        if (this.loggedIn)
            throw Error('User already logged in');

        return execLogin(username, password).then(data => {
            const accessToken = data.access_token
            const refreshToken = data.refresh_token;
            const accessExpiration = getCurrentTime() + data.expires_in;
            const refreshExpiration = getCurrentTime() + data.refresh_expires_in;
            if (data.token_type !== 'bearer' || accessToken == null || isNaN(accessExpiration) || refreshToken == null || isNaN(refreshExpiration))
                throw Error('Invalid server response');
            this.store = {token: accessToken, expiration: accessExpiration, refreshToken, refreshExpiration};
        }).then(() => {
            return fetchUser(this, CURRENT_USER_ID).then(user => {
                window.localStorage.setItem(USER_STORE_KEY, JSON.stringify({user_data: user.serialize()}))
                this.currentUserCache = user;
            });
        });
    }

    /**
     * Performs a logout and erases the saved session storage
     */
    doLogout() {
        if (!this.loggedIn) return;
        this.getAccessToken().then(token => { token != null && execLogout(token) });

        this.store = undefined;
        this.currentUserCache = undefined;
        window.localStorage.removeItem(USER_STORE_KEY);
    }

    /**
     * Notify that this session (token) is no longer valid
     *
     * This method should be usually called after failed API calls due to HTTP 401 Unauthorized responses.
     */
    notifyInvalid() {
        this.notifyListeners();
    }

    set error(bool) {
        if(bool) {
            window.localStorage.setItem('error', JSON.stringify(true));
            this.notifyListeners();
        }
        else {
            window.localStorage.removeItem('error');
        }
    }

    get error() {
        return window.localStorage.getItem('error') !== null
    }

    toString() {
        return `Session(loggedIn: ${this.loggedIn}, valid: ${this.valid}, online: ${this.online})`;
    }

}
