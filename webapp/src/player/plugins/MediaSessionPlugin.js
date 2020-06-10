import PlayerEvents from '../PlayerEvents';

const PLUGIN_DESCRIPTION = 'Browser Media Session API plugin';

/**
 * Adds Media Session API support to the Harmony player.
 *
 * This allows the user to control playback and see title and album art from his OS or browser media controls.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
 */
class MediaSessionPlugin {

  /** @type MediaPlayerCore */
  #player = null;

  constructor() {
    this.handleNewMedia = this.handleNewMedia.bind(this);
  }

  bindPlayerPlugin(player) {
    if (!('mediaSession' in navigator))
      return {description: PLUGIN_DESCRIPTION + ' (no browser support)'}

    this.#player = player;
    player.addEventListener(PlayerEvents.NEW_MEDIA, this.handleNewMedia)

    navigator.mediaSession.setActionHandler('play', () => player.play());
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    //navigator.mediaSession.setActionHandler('seekbackward', function() { /* something */ });
    //navigator.mediaSession.setActionHandler('seekforward', function() { /* something */ });
    navigator.mediaSession.setActionHandler('previoustrack', () => player.previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => player.next());

    return {description: PLUGIN_DESCRIPTION};
  }

  unbindPlayerPlugin(player) {
    if (!('mediaSession' in navigator)) return;

    player.removeEventListener(PlayerEvents.NEW_MEDIA, this.handleNewMedia);
  }

  handleNewMedia(id) {
    const mediaTags = this.#player.currentMediaInfo.tags;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: mediaTags?.get('title') || (APP_NAME + ' player'),
      artist: mediaTags?.get('artist') || 'Unknown Artist',
      album: mediaTags?.get('album') || undefined,
      artwork: [
        {src: require('../../assets/albumart_default.jpg'), sizes: '400x400', type: 'image/jpeg'}
      ]
    });
  }

}

export default MediaSessionPlugin;
