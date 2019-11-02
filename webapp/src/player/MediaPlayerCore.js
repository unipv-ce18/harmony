import {MediaItemInfo, PlayStartModes} from './MediaPlayer';
import {PlaybackEngine} from './PlaybackEngine';
import {MediaProvider} from './delivery/MediaProvider';

class MediaPlayerCore {

  playbackEngine = new PlaybackEngine(new MediaProvider());

  #playlistIndex = 0;
  #playlist = [];

  play(items, startMode = PlayStartModes.APPEND_PLAYLIST_AND_PLAY) {
    if (items === null) return;
    if (items instanceof Object) items = [items];
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

    console.log(this.#playlist, this.#playlistIndex);
    if (startMode.play) {
      this.playbackEngine.play(this.#playlist[this.#playlistIndex].id, 0);
    }
  }

}

export default MediaPlayerCore;
