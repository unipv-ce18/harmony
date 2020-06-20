import {MediaLoader} from './MediaLoader';
import {StreamDecrypter} from './StreamDecrypter';
import PlayStates from './PlayStates';
import PlayerEvents from './PlayerEvents';

const MEDIA_ELEMENT_WATCHED_EVENTS = [
  'play',       // Playback starts
  'ended',      // Playback stops at end of media
  'pause',      // A request to pause the media is made
  'timeupdate', // The time indicated by currentTime has changed
  'playing',    // Playback starts after pause or lack of data
  'waiting'     // Playback stopped due to a temporary lack of data
];

export class PlaybackEngine {

  /** @type {EventTarget} */
  #eventTarget;

  /** @type {string} */
  #currentMediaId = undefined;

  get currentMediaId() {
    return this.#currentMediaId;
  }

  /** @type {function} */
  #nextMediaIdSource;

  /** @type {HTMLMediaElement} */
  #mediaTag;

  /** @type {number} */
  #mediaTimeOffset = 0;

  /** @type {MediaProvider} */
  #mediaProvider;

  /** @type {MediaLoader} */
  #mediaLoader;

  /** @type {StreamDecrypter} */
  #emeDecrypter = null;

  #_playbackState = PlayStates.STOPPED;

  get playbackState() {
    return this.#_playbackState;
  }

  set #playbackState(value) {
    const changed = this.#_playbackState !== value;
    this.#_playbackState = value;
    if (changed) this.#notifyStateChange();
  }

  constructor(eventTarget, mediaProvider, mediaElement, nextMediaIdSource) {
    this.#eventTarget = eventTarget;
    this.#mediaProvider = mediaProvider;
    if (!(mediaElement instanceof HTMLMediaElement))
      throw Error('Tags need to be instance of HTMLMediaElement');

    // Bind listener to media element
    const listener = this.#mediaElementListener.bind(this);
    for (let evt of MEDIA_ELEMENT_WATCHED_EVENTS)
      mediaElement.addEventListener(evt, listener);

    this.#mediaTag = mediaElement;
    this.#nextMediaIdSource = nextMediaIdSource;
    this.#emeDecrypter = new StreamDecrypter(mediaProvider, mediaElement);
  }

  play(mediaItemId = null, seekTime = -1) {
    // Do nothing if no current item and no passed item
    if (this.currentMediaId === null && mediaItemId === null) return;

    // We can optimize if new media == next media hint, but gapless playback may sound weird while doing this

    // If a track was specified let's switch to the new one
    if (mediaItemId !== null) {
      this.#mediaLoader = new MediaLoader(this.#mediaProvider, this.#mediaTag, mediaItemId, () => {
        const nextId = this.#nextMediaIdSource();
        this.#emeDecrypter.currentItemId = nextId;
        return nextId;
      })
        .onMediaResource(this.#onMediaChange.bind(this))
        .onError(err => {
          console.error('Error during segment fetch', err);
          this.#playbackState = PlayStates.ERRORED
        });
    }

    if (this.currentMediaId !== null || mediaItemId !== null) {
      // Let's play the thing
      if (seekTime >= 0) this.#mediaTag.currentTime = seekTime;
      this.#mediaTag.play();
      this.#playbackState = PlayStates.BUFFERING;
    } else {
      console.warn('No media to play');
    }
  }

  seek(seekTime) {
    this.#mediaTag.currentTime = this.#mediaTimeOffset + parseInt(seekTime);
  }

  pause() {
    if (this.playbackState !== PlayStates.PLAYING) return;

    this.#mediaTag.pause();
    this.#playbackState = PlayStates.PAUSED;
  }

  stop() {
    this.#mediaTag.pause();
    this.#mediaTag.currentTime = 0;
    this.#playbackState = PlayStates.STOPPED;
  }

  #mediaElementListener(event) {
    switch (event.type) {
      case 'playing':
        if (this.playbackState === PlayStates.BUFFERING) this.#playbackState = PlayStates.PLAYING;
        break;
      case 'waiting':
        this.#playbackState = PlayStates.BUFFERING;
        break;
      case 'timeupdate':
        this.#eventTarget.dispatchEvent(
          new CustomEvent(PlayerEvents.TIME_UPDATE, {detail: {cur: this.#mediaTag.currentTime - this.#mediaTimeOffset}}));
    }
  }

  #onMediaChange(mediaData) {
    // Note, we are using the ID from the resource to set our current ID and the decrypter one
    this.#currentMediaId = mediaData.res.id;
    this.#emeDecrypter.currentItemId = mediaData.res.id;

    this.#mediaTimeOffset = mediaData.startTime;
    this.#eventTarget.dispatchEvent(
      new CustomEvent(PlayerEvents.NEW_MEDIA, {detail: {id: this.currentMediaId, res: mediaData.res}}))
  }

  #notifyStateChange() {
    this.#eventTarget.dispatchEvent(
      new CustomEvent(PlayerEvents.STATE_CHANGE, {detail: {newState: this.playbackState}}));
  }

}
