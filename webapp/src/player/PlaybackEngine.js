import {MediaLoader} from './delivery/MediaLoader';
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
  #_currentItemId = undefined;

  get currentItemId() {
    return this.#_currentItemId;
  }

  set #currentItemId(value) {
    this.#_currentItemId = value;
    this.#emeDecrypter.currentItemId = value;
  }

  /** @type {string} */
  #nextItemIdHint = undefined;

  /** @type {HTMLMediaElement} */
  #mediaTag;

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

  constructor(eventTarget, mediaProvider, mediaElement) {
    this.#eventTarget = eventTarget;
    this.#mediaProvider = mediaProvider;
    if (!(mediaElement instanceof HTMLMediaElement))
      throw Error('Tags need to be instance of HTMLMediaElement');

    // Bind listener to media element
    const listener = this.#mediaElementListener.bind(this);
    for (let evt of MEDIA_ELEMENT_WATCHED_EVENTS)
      mediaElement.addEventListener(evt, listener);

    this.#mediaTag = mediaElement;
    this.#emeDecrypter = new StreamDecrypter(mediaProvider, mediaElement);
  }

  play(mediaItemId = null, seekTime = -1) {
    // Do nothing if no current item and no passed item
    if (this.currentItemId === null && mediaItemId === null) return;

    // We can optimize if new media == next media hint, but gapless playback may sound weird while doing this

    // If a track was specified let's switch to the new one
    if (mediaItemId !== null) {
      this.#mediaLoader = new MediaLoader(this.#mediaProvider, this.#mediaTag, mediaItemId)
        .onInfoFetch(this.#notifyMediaChange.bind(this))
        .onError(err => {
          console.error('Error during segment fetch', err);
          this.#playbackState = PlayStates.ERRORED
        });
      this.#currentItemId = mediaItemId;
    }

    if (this.currentItemId) {
      // Let's play the thing
      if (seekTime >= 0) this.#mediaTag.currentTime = seekTime;
      this.#mediaTag.play();
      this.#playbackState = PlayStates.BUFFERING;
    } else {
      console.warn('No media to play');
    }
  }

  seek(seekTime) {
    this.#mediaTag.currentTime = seekTime;
    if (this.playbackState === PlayStates.PLAYING) this.#mediaTag.play();
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
          new CustomEvent(PlayerEvents.TIME_UPDATE, {detail: {cur: this.#mediaTag.currentTime}}));
    }
  }

  #notifyMediaChange(mediaRes) {
    this.#eventTarget.dispatchEvent(
      new CustomEvent(PlayerEvents.NEW_MEDIA, {detail: {id: this.currentItemId, res: mediaRes}}))
  }

  #notifyStateChange() {
    this.#eventTarget.dispatchEvent(
      new CustomEvent(PlayerEvents.STATE_CHANGE, {detail: {newState: this.playbackState}}));
  }

}
