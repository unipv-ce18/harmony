import {AdaptivePlayerSource} from './delivery/AdaptivePlayerSource';
import {StreamDecrypter} from './StreamDecrypter';

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

const PlayStates = Object.freeze({
  DETACHED: 0,
  STOPPED: 1,
  PAUSED: 2,
  PLAYING: 3
});

export class PlaybackEngine {

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

  /** @type {function} */
  statusListener = null;

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
    this.#mediaProvider = mediaProvider;
    this.#emeDecrypter = new StreamDecrypter(mediaProvider);
  }

  attachDOM(aTag, bTag) {
    if (!(aTag instanceof HTMLMediaElement && bTag instanceof HTMLMediaElement))
      throw Error('Tags need to be instance of HTMLMediaElement');

    const listener = this.#mediaElementListener.bind(this);
    for (let evt of ['play', 'ended', 'pause', 'timeupdate']) {
      aTag.addEventListener(evt, listener);
      bTag.addEventListener(evt, listener)
    }
    this.#emeDecrypter.attach(aTag);
    this.#emeDecrypter.attach(bTag);

    this.#htmlMediaTags = new ABTags(aTag, bTag);
    this.#playbackState = PlayStates.STOPPED;
  }

  play(mediaItemId = null, seekTime = 0) {
    this.#checkNotDetached();
    const mediaElement = this.#htmlMediaTags.current;

    // Do nothing if no current item and no passed item
    if (this.currentItemId === null && mediaItemId === null) return;

    // We can optimize if new media == next media hint, but gapless playback may sound weird while doing this

    // If a track was specified let's switch to the new one
    if (mediaItemId !== null) {
      const source = new AdaptivePlayerSource(this.#mediaProvider, mediaItemId)
        .onError(err => this.stop());
      mediaElement.src = source.sourceURL;
    }

    // Let's play the thing
    this.#currentItemId = mediaItemId;
    if (seekTime > 0) mediaElement.currentTime = seekTime;
    mediaElement.play();
    this.#playbackState = PlayStates.PLAYING;
  }

  pause() {
    this.#checkNotDetached();
    this.#htmlMediaTags.current.pause();
    this.#playbackState = PlayStates.PAUSED;
  }

  stop() {
    this.#checkNotDetached();
    this.#htmlMediaTags.current.removeAttribute('src');
    this.#playbackState = PlayStates.STOPPED;
  }

  #mediaElementListener(event) {
    //console.log('MediaElementListener', this, event);
    // TODO magic
  }

  #notifyMediaChange() {
    console.log('New media', this.currentItemId);
    if (this.statusListener) this.statusListener({status: 'mediaChange'});
  }

  #notifyStateChange() {
    console.log('New playback state', this.playbackState);
    if (this.statusListener) this.statusListener({status: 'stateChange', newState: this.playbackState});
  }

  #checkNotDetached() {
    if (this.playbackState === PlayStates.DETACHED)
      throw Error('PlaybackEngine not attached to DOM');
  }

}
