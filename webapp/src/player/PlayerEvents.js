const PlayerEvents = Object.freeze({
  /**
   * Triggered when the current playback time changes
   *
   * Event detail parameters:
   * - `cur`: the new playback time
   */
  TIME_UPDATE: 'timeupdate',

  /**
   * Triggered when a new media starts playing
   *
   * Event detail parameters:
   * - `id`: the ID of the new track
   * - `res`: the track's {@link MediaResource}
   */
  NEW_MEDIA: 'newmedia',

  /**
   * Triggered when playback state changes
   *
   * Event detail parameters:
   * - `newState` holds one of {@link PlayStates}
   */
  STATE_CHANGE: 'statechange',

  /**
   * Triggered when the player is being terminated
   */
  SHUTDOWN: 'shutdown'
});

export default PlayerEvents;
