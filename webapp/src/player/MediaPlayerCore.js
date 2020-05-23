import {MediaItemInfo, PlayStartModes} from './MediaPlayer';
import {PlaybackEngine} from './PlaybackEngine';
import {MediaProvider} from './delivery/MediaProvider';
import PlayStates from './PlayStates';

class MediaPlayerCore extends EventTarget {

  #playbackEngine;
  #plugins = [];

  #playlistIndex = 0;
  #playlist = [];

  initialize(mediaTag, sessionManager) {
    sessionManager.addStatusListener(this.#onSessionStatusChange.bind(this))
    const mediaProvider = new MediaProvider(sessionManager.getAccessToken());
    this.#playbackEngine = new PlaybackEngine(this, mediaProvider, mediaTag, () => {
      console.log('Next media requested');
      const nextItem = this.#playlist[++this.#playlistIndex];
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
    return this.#playlist[this.#playlistIndex]
  }

  play(items, startMode = PlayStartModes.APPEND_PLAYLIST_AND_PLAY) {
    if (!this.#playbackEngine)
        throw Error('PlaybackEngine not initialized');

    // If we add new items for playback let's alter the playlist first
    if (items) {
      if (!(items instanceof Array)) items = [items];
      if (items.length === 0) return;

      for (let item of items) {
        if (!(item instanceof MediaItemInfo))
          throw Error('Items to be played must be instance of MediaItemInfo');
      }

      if (startMode.trunc) {  // Truncate playlist
        this.#playlistIndex = 0;
        this.#playlist = items;
      } else {  // Append to current playlist
        this.#playlistIndex = this.#playlist.length;
        this.#playlist = this.#playlist.concat(items);
      }
    }

    if (startMode.play) {
      console.log('Media playback start', this.#playlist, this.#playlistIndex);

      // If we have items switch to the new track
      if (items) {
        this.#playbackEngine.play(this.#playlist[this.#playlistIndex].id, 0);
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
