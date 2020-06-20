const PlayStates = Object.freeze({
  STOPPED: 1,
  PAUSED: 2,
  BUFFERING: 3,
  PLAYING: 4,
  ERRORED: 5
});

function describeState(playState) {
  switch (playState) {
    case PlayStates.STOPPED:
      return 'Stopped';
    case PlayStates.PAUSED:
      return 'Paused';
    case PlayStates.BUFFERING:
      return 'Buffering';
    case PlayStates.PLAYING:
      return 'Playing';
    case PlayStates.ERRORED:
      return 'Error';
    default:
      return `Unk. state #${playState}`;
  }
}

export default PlayStates;
