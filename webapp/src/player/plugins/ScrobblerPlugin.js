import PlayerEvents from '../PlayerEvents';
import PlayStates from '../PlayStates';

const TAG = '[Player.Plugin.Scrobbler]';

// Percentage of the song to play before signaling a play event
const SEND_SCROBBLE_THRESHOLD = 0.5;

class ScrobblerPlugin {

  #accTime = 0;
  #totTime = null;
  #interval = null;

  constructor() {
    this.onNewMedia = this.onNewMedia.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
  }

  get #submittable() {
    return this.#accTime / this.#totTime >= SEND_SCROBBLE_THRESHOLD;
  }

  bindPlayerPlugin(player) {
    player.addEventListener(PlayerEvents.NEW_MEDIA, this.onNewMedia);
    player.addEventListener(PlayerEvents.STATE_CHANGE, this.onStateChange);
  }

  unbindPlayerPlugin(player) {
    player.removeEventListener(PlayerEvents.NEW_MEDIA, this.onNewMedia);
    player.removeEventListener(PlayerEvents.STATE_CHANGE, this.onStateChange);
  }

  onNewMedia(e) {
    this.#reset();
    this.#totTime = e.detail.res.duration;
    console.log('%s New media (%ds), counter cleared', TAG, this.#totTime);
  }

  onStateChange(e) {
    if (e.detail.newState === PlayStates.STOPPED || e.detail.newState === PlayStates.ERRORED) {
      this.#reset();

    } else if (e.detail.newState === PlayStates.PAUSED) {
      if (this.#interval != null) {
        console.log(TAG, 'Stopped scrobble counter');
        clearInterval(this.#interval);
        this.#interval = null;
      }

    } else if (e.detail.newState === PlayStates.PLAYING) {
      if (!this.#submittable && this.#interval == null) {
        console.log(TAG, 'Started scrobble counter');
        this.#interval = setInterval(() => {
          this.#accTime++;
          console.log('%s 🎵 %ds of %ds',
            TAG, this.#accTime, this.#totTime * SEND_SCROBBLE_THRESHOLD);

          if (this.#submittable) {
            clearInterval(this.#interval);
            this.#interval = null;

            e.target.socketConnection.sendScrobble(e.target.currentMediaInfo.id)
              .then(() => console.log(TAG, 'Scrobble submitted!'))
              .catch(e => console.error(TAG, 'Failed to submit scrobble', e));
          }
        }, 1000);
      }
    }
  }

  #reset() {
    if (this.#interval != null) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
    this.#accTime = 0;
  }

}

export default ScrobblerPlugin;
