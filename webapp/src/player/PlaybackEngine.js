import {AdaptivePlayerSource} from './delivery/AdaptivePlayerSource';
import {StreamDecrypter} from './StreamDecrypter';
import PlayStates from './PlayStates';

/**
 * Holds and swaps HTML Media tags (or anything given) for pseudo-gapless playback support
 */
class ABTags {

  aTag;
  bTag;
  #state = false;

  constructor(aTag, bTag) {
    this.aTag = aTag;
    this.bTag = bTag;
  }

  flip() {
    this.#state = !this.#state;
  }

  get current() {
    return this.#state ? this.bTag : this.aTag;
  }

  get next() {
    return this.#state ? this.aTag : this.bTag;
  }

}

const MEDIA_ELEMENT_WATCHED_EVENTS = [
  'play',       // Playback starts
  'ended',      // Playback stops at end of media
  'pause',      // A request to pause the media is made
  'timeupdate', // The time indicated by currentTime has changed
  'playing',    // Playback starts after pause or lack of data
  'waiting'     // Playback stopped due to a temporary lack of data
];

export class PlaybackEngine extends EventTarget {

  /** @type {string} */
  #_currentItemId = undefined;

  get currentItemId() {
    return this.#_currentItemId;
  }

  set #currentItemId(value) {
    this.#_currentItemId = value;
    this.#emeDecrypter.currentItemId = value;
    this.#notifyMediaChange();
  }

  /** @type {string} */
  #nextItemIdHint = undefined;

  /** @type {ABTags} */
  #htmlMediaTags = null;

  /** @type {MediaProvider} */
  #mediaProvider = null;

  /** @type {StreamDecrypter} */
  #emeDecrypter = null;

  #_playbackState = PlayStates.DETACHED;

  get playbackState() {
    return this.#_playbackState;
  }

  set #playbackState(value) {
    const changed = this.#_playbackState !== value;
    this.#_playbackState = value;
    if (changed) this.#notifyStateChange();
  }

  constructor(mediaProvider) {
    super();
    this.#mediaProvider = mediaProvider;
    this.#emeDecrypter = new StreamDecrypter(mediaProvider);
  }

  attachDOM(aTag, bTag) {
    if (!(aTag instanceof HTMLMediaElement && bTag instanceof HTMLMediaElement))
      throw Error('Tags need to be instance of HTMLMediaElement');

    const listener = this.#mediaElementListener.bind(this);
    for (let evt of MEDIA_ELEMENT_WATCHED_EVENTS) {
      aTag.addEventListener(evt, listener);
      bTag.addEventListener(evt, listener)
    }
    this.#emeDecrypter.attach(aTag);
    this.#emeDecrypter.attach(bTag);

    this.#htmlMediaTags = new ABTags(aTag, bTag);
    this.#playbackState = PlayStates.STOPPED;
  }

  play(mediaItemId = null, seekTime = -1) {
    this.#checkNotDetached();
    const mediaElement = this.#htmlMediaTags.current;

    // Do nothing if no current item and no passed item
    if (this.currentItemId === null && mediaItemId === null) return;

    // We can optimize if new media == next media hint, but gapless playback may sound weird while doing this

    // If a track was specified let's switch to the new one
    if (mediaItemId !== null) {
      const source = new AdaptivePlayerSource(this.#mediaProvider, mediaItemId)
        .onError(err => this.#playbackState = PlayStates.ERRORED);
      mediaElement.src = source.sourceURL;
      this.#currentItemId = mediaItemId;
    }

    if (this.currentItemId) {
      // Let's play the thing
      if (seekTime >= 0) mediaElement.currentTime = seekTime;
      mediaElement.play();
      this.#playbackState = PlayStates.BUFFERING;
    } else {
      console.warn('No media to play');
    }
  }

  seek(seekTime) {
    this.#htmlMediaTags.current.currentTime = seekTime;
  }

  pause() {
    if (this.playbackState !== PlayStates.PLAYING) return;

    this.#checkNotDetached();
    this.#htmlMediaTags.current.pause();
    this.#playbackState = PlayStates.PAUSED;
  }

  stop() {
    this.#checkNotDetached();
    this.#htmlMediaTags.current.pause();
    this.#htmlMediaTags.current.currentTime = 0;
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
        // TODO: start prefetching next media
        this.dispatchEvent(new CustomEvent('timeupdate', {
          detail: {
            cur: this.#htmlMediaTags.current.currentTime,
            end: this.#htmlMediaTags.current.duration
          }
        }));
    }
  }

  #notifyMediaChange() {
    console.log('New media', this.currentItemId);
    this.dispatchEvent(new CustomEvent('newmedia'))
  }

  #notifyStateChange() {
    this.dispatchEvent(new CustomEvent('statechange', {detail: {newState: this.playbackState}}));
  }

  #checkNotDetached() {
    if (this.playbackState === PlayStates.DETACHED)
      throw Error('PlaybackEngine not attached to DOM');
  }

}
