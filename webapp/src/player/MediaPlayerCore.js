import {MediaItemInfo, PlayStartModes} from './MediaPlayer';
import {PlaybackEngine} from './PlaybackEngine';
import {MediaProvider} from './delivery/MediaProvider';
import PlayStates from './PlayStates';

class MediaPlayerCore extends EventTarget {

  #playbackEngine;
  #plugins = [];

  #queueIndex = 0;
  #queue = [];

  initialize(mediaTag, sessionManager) {
    sessionManager.addStatusListener(this.#onSessionStatusChange.bind(this))
    const mediaProvider = new MediaProvider(sessionManager);
    this.#playbackEngine = new PlaybackEngine(this, mediaProvider, mediaTag, () => {
      console.log('Next media requested');
      const nextItem = this.#queue[++this.#queueIndex];
      return nextItem && nextItem.id; // same item for now
    });
  }

  addPlugin(plugin) {
    const meta = plugin.bindPlayerPlugin(this)
    this.#plugins.push({obj: plugin, ...meta});
  }

  removePlugin(plugin) {
    const idx = this.#plugins.findIndex(p => p.obj === plugin);
    if (idx !== -1) {
      this.#plugins[idx].obj.unbindPlayerPlugin(this)
      this.#plugins.splice(idx, 1);
    }
  }

  get playbackState() {
    return this.#playbackEngine.playbackState;
  }

  get currentMediaInfo() {
    return this.#queue[this.#queueIndex]
  }

  play(items, startMode = PlayStartModes.APPEND_QUEUE_AND_PLAY) {
    if (!this.#playbackEngine)
        throw Error('PlaybackEngine not initialized');

    // If we add new items for playback let's alter the queue first
    if (items) {
      if (!(items instanceof Array)) items = [items];
      if (items.length === 0) return;

      for (let item of items) {
        if (!(item instanceof MediaItemInfo))
          throw Error('Items to be played must be instance of MediaItemInfo');
      }

      if (startMode.trunc) {  // Truncate queue
        this.#queueIndex = 0;
        this.#queue = items;
      } else {  // Append to current queue
        this.#queue = this.#queue.concat(items);
      }
    }

    if (startMode.play) {
      console.log('Media playback start', this.#queue, this.#queueIndex);

      // If we have items switch to the new track
      if (items) {
        this.#playbackEngine.play(this.#queue[this.#queueIndex].id, 0);
        return;
      }

      // If no items and the player not already playing, simply start/resume
      if (this.#playbackEngine.playbackState !== PlayStates.PLAYING)
        this.#playbackEngine.play();
    }
  }

  pause() {
    this.#playbackEngine.pause();
  }

  stop() {
    this.#playbackEngine.stop();
  }

  seek(seekTime) {
    this.#playbackEngine.seek(seekTime)
  }

  previous() {
    alert('not implemented');
  }

  next() {
    alert('not implemented');
  }

  #onSessionStatusChange() {
    // TODO: Update access token in media provider, change play state if needed when going offline
  }

}

export default MediaPlayerCore;
