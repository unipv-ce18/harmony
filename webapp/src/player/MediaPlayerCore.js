import {MediaItemInfo, PlayStartModes} from './MediaPlayer';
import {PlaybackEngine} from './PlaybackEngine';
import {MediaProvider} from './delivery/MediaProvider';
import PlayStates from './PlayStates';

class MediaPlayerCore extends EventTarget {

  #playbackEngine;

  #playlistIndex = 0;
  #playlist = [];

  initialize(mediaTag) {
    this.#playbackEngine = new PlaybackEngine(this, new MediaProvider(), mediaTag, () => {
      console.log('Next media requested');
      return this.#playlist[this.#playlistIndex++].id; // same item for now
    });
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

}

export default MediaPlayerCore;
