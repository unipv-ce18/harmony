export const PlayStartModes = Object.freeze({
  /**
   * Wipes out the current playlist and add the provided item(s) to it
   */
  TRUNCATE_PLAYLIST: {trunc: true, play: false},

  /**
   * Same as {@link PlayStartModes.TRUNCATE_PLAYLIST} but also starts playback
   */
  TRUNCATE_PLAYLIST_AND_PLAY: {trunc: true, play: true},

  /**
   * Appends the provided item(s) to the end of the playlist
   */
  APPEND_PLAYLIST: {trunc: false, play: false},

  /**
   * Same as {@link PlayStartModes.APPEND_PLAYLIST} but also starts playback of the new items
   */
  APPEND_PLAYLIST_AND_PLAY: {trunc: false, play: true}
});

/**
 * Represents a playable media item
 */
export class MediaItemInfo {
  id;
  tags;

  /**
   * Creates a new {@link MediaItemInfo} instance
   *
   * @param {String} id The Harmony recording ID
   * @param {Object} tags Map of tags following the Vorbis comment field specification <https://wiki.xiph.org/VorbisComment>
   * @param {String} type The type of media to play
   */
  constructor(id, tags, type = 'audio') {
    this.id = id;
    this.tags = tags;
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
  loadListener = null;

  #_instance = null;

  play(items, startMode) {
    this.fetchInstance()
      .then(inst => inst.play(items, startMode));
  }

  get instance() {
    return this.#_instance;
  }

  fetchInstance() {
    if (this.#_instance)
      return Promise.resolve(this.#_instance);

    // This promise resolves when the player core is loaded and initialized (i.e. bound to the DOM)
    return new Promise(resolvePlayerReady => {
      import(/* webpackChunkName: "player" */ './MediaPlayerCore').then(m => {
        if (!this.loadListener)
          throw Error('Cannot initialize player, no load listener defined');

        // We have the player, call the load listener (to spin up the UI) and let this resolve afterwards
        const playerInstance = new m.default();
        this.loadListener()
          .then(({aTag, bTag}) => playerInstance.initialize(aTag, bTag))
          .then(() => resolvePlayerReady(playerInstance));
      });
    }).then(inst => this.#_instance = inst);
  }
}
