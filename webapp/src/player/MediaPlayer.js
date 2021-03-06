import {removeArrayElement} from '../core/utils';

import PlayerEvents from './PlayerEvents';

export const PlayStartModes = Object.freeze({
  /**
   * Wipes out the queue and add the provided item(s) to it
   */
  TRUNCATE_QUEUE: {trunc: true, play: false},

  /**
   * Same as {@link PlayStartModes.TRUNCATE_QUEUE} but also starts playback
   */
  TRUNCATE_QUEUE_AND_PLAY: {trunc: true, play: true},

  /**
   * Appends the provided item(s) to the end of the queue
   */
  APPEND_QUEUE: {trunc: false, play: false},

  /**
   * Same as {@link PlayStartModes.APPEND_QUEUE} but also starts playback of the new items
   */
  APPEND_QUEUE_AND_PLAY: {trunc: false, play: true}
});

/**
 * Represents a playable media item
 */
export class MediaItemInfo {

  // Tags, see the Vorbis comment specification <https://wiki.xiph.org/VorbisComment> for recommended names
  static TAG_TITLE = 'TITLE';
  static TAG_RELEASE = 'ALBUM';
  static TAG_TRACK_NR = 'TRACKNUMBER';
  static TAG_ARTIST = 'ARTIST';

  // Nonstandard tags
  static TAG_ALBUMART_URL = 'ALBUMART_URL';

  id;
  tags;

  /**
   * Creates a new {@link MediaItemInfo} instance
   *
   * @param {String} id The Harmony recording ID
   * @param {Object} tags Map of track tags
   * @param {String} type The type of media to play
   */
  constructor(id, tags, type = 'audio') {
    this.id = id;
    this.tags = tags || {};
  }

  get title() {
    return this.tags[MediaItemInfo.TAG_TITLE] || `Song {${this.id}}`;
  }

  get release() {
    return this.tags[MediaItemInfo.TAG_RELEASE] || '';
  }

  get artist() {
    return this.tags[MediaItemInfo.TAG_ARTIST] || 'Unknown artist';
  }

}

/**
 * Lazy interface for {@link MediaPlayerCore}
 *
 * This minimal facade allows the main player to be loaded only if required, a listener can be attached to be notified
 * when the actual player has been loaded.
 */
export class MediaPlayer {

  /** @type {function} */
  playerInitializer = null;

  #_instance = null;

  #instanceLoadObservers = [];

  play(items, startMode) {
    this.fetchInstance()
      .then(inst => inst.play(items, startMode));
  }

  pause() {
    if(!this.instance) throw new Error('Instance not defined.');
    this.instance.pause();
  }

  set #instance(instance) {
    this.#_instance = instance;
    this.#instanceLoadObservers.forEach(f => f(instance));
  }

  get instance() {
    return this.#_instance;
  }

  addInstanceLoadObserver(observer) {
    this.#instanceLoadObservers.push(observer);
    if (this.#_instance !== null) observer(this.instance);
  }

  removeInstanceLoadObserver(observer) {
    if (!removeArrayElement(this.#instanceLoadObservers, observer))
      throw new Error('Observer not found');
  }

  fetchInstance() {
    if (this.#_instance)
      return Promise.resolve(this.#_instance);

    // This promise resolves when the player core is loaded and initialized (i.e. bound to the DOM)
    return import(/* webpackChunkName: "player" */ './MediaPlayerCore').then(m => {
      const playerInstance = new m.default();

      if (!this.playerInitializer)
        throw Error('Cannot initialize player, no initializer defined');

      playerInstance.addEventListener(PlayerEvents.SHUTDOWN, () => this.#_instance = null);
      
      // We have the player, call the load listener which generates a future to spin up the UI
      this.#instance = playerInstance;
      return this.playerInitializer().then(() => playerInstance);
    });
  }
}
