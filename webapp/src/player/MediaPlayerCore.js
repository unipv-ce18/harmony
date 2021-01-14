import {MediaItemInfo, PlayStartModes} from './MediaPlayer';
import {PlaybackEngine} from './PlaybackEngine';
import {MediaProvider} from './delivery/MediaProvider';
import {SocketConnection} from './delivery/SocketConnection';
import PlayStates from './PlayStates';
import PlayerEvents from './PlayerEvents';

class MediaPlayerCore extends EventTarget {

  #playbackEngine;
  #sessionManager;
  #plugins = [];
  #shuttingDown = false;

  #queueIndex = 0;
  #queue = [];

  #lastQueueId = 0;

  socketConnection; // Public for plugin access

  constructor() {
    super();
    this.onSessionStatusChange = this.onSessionStatusChange.bind(this);
  }

  initialize(mediaTag, sessionManager) {
    sessionManager.addStatusListener(this.onSessionStatusChange);
    this.#sessionManager = sessionManager;
    this.socketConnection = new SocketConnection(PLAYER_SOCKET_URL, sessionManager);
    this.#playbackEngine = new PlaybackEngine(this, new MediaProvider(this.socketConnection), mediaTag, () => {
      console.log('Next media requested');
      const nextItem = this.#queue[++this.#queueIndex];
      return nextItem && nextItem.media.id; // same item for now
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

  get queue() {
    return this.#queue;
  }

  get queueIndex() {
    return this.#queueIndex;
  }

  get currentMediaInfo() {
    return this.#queue[this.#queueIndex]?.media;
  }

  get currentMediaQid() {
    return this.#queue[this.#queueIndex]?.qid;
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

      // Add a queue ID to each item to ease tracking in UI, e.g. (p)react keys
      const indexedItems = items.map(media => ({qid: this.#lastQueueId++, media}));

      if (startMode.trunc) {  // Truncate queue
        this.#queueIndex = 0;
        this.#queue = indexedItems;
      } else {  // Append to current queue
        this.#queueIndex = this.#queue.length;
        this.#queue = this.#queue.concat(indexedItems);
      }
    }

    if (startMode.play) {
      console.log('Media playback start', this.#queue, this.#queueIndex);

      // If we have items switch to the new track
      if (items) {
        this.#playbackEngine.play(this.#queue[this.#queueIndex].media.id, 0);
        return;
      }

      // If no items and the player not already playing, simply start/resume
      if (this.#playbackEngine.playbackState !== PlayStates.PLAYING)
        this.#playbackEngine.play();
    }
  }

  playFromQueue(qid) {
    const queueIndex = this.#queue.findIndex(i => i.qid === qid);
    if (queueIndex !== -1) {
      this.#queueIndex = queueIndex;
      this.#playbackEngine.play(this.#queue[this.#queueIndex].media.id, 0);
    }
  }

  removeFromQueue(qids) {
    // Map to indexes
    const idxs = qids
      .map(qid => this.#queue.findIndex(i => i.qid === qid))
      .filter(x => x !== -1);

    // Select new playing index (backwards, then forwards) if the previous is to get removed
    let newQueueIndex = this.#queueIndex;
    while (idxs.includes(newQueueIndex)) newQueueIndex++;

    // If we reached end of list, all items got removed
    const newQid = newQueueIndex !== this.#queue.length ? this.#queue[newQueueIndex].qid : null;
    const currentQid = this.currentMediaQid;

    // Filter the queue
    this.#queue = this.#queue.filter(i => !qids.includes(i.qid));

    // Play the new (remaining) song if so required
    if (newQid !== currentQid) {
      if (newQid != null)
        this.playFromQueue(newQid);
      else
        this.stop();

    } else {
      // If same item, resync queue index
      this.#queueIndex = this.#queue.findIndex(i => i.qid === currentQid);
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
    if (this.queueIndex > 0)
      this.#playbackEngine.play(this.#queue[--this.#queueIndex].media.id, 0);
  }

  next() {
    if (this.queueIndex < this.#queue.length - 1)
      this.#playbackEngine.play(this.#queue[++this.#queueIndex].media.id, 0);
  }

  shutdown() {
    if (this.#shuttingDown) return;

    this.#shuttingDown = true;
    this.#playbackEngine.stop();
    this.dispatchEvent(new CustomEvent(PlayerEvents.SHUTDOWN));
    this.#sessionManager.removeStatusListener(this.onSessionStatusChange);
  }

  onSessionStatusChange() {
    // TODO: Change play state if needed when going offline
  }

}

export default MediaPlayerCore;
