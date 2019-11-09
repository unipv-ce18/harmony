import {Component, createRef} from 'preact';
import PlayStates from '../PlayStates';
import PlayerEvents from '../PlayerEvents';

function getPlayStateMessage(playState) {
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

class MediaPlayerView extends Component {

  audioTagRef = createRef();
  audioSeek = createRef();

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.player.initialize(this.audioTagRef.current);
    this.props.player.addEventListener(PlayerEvents.STATE_CHANGE,
      e => this.setState({playState: e.detail.newState}));
    this.props.player.addEventListener(PlayerEvents.NEW_MEDIA, e => {
      this.audioSeek.current.max = e.detail.res.duration;
    });
    this.props.player.addEventListener(PlayerEvents.TIME_UPDATE, e => {
      const audioSeek = this.audioSeek.current;
      if (document.activeElement !== audioSeek) {
        audioSeek.value = e.detail.cur;
      }
    });
    this.props.onLoaded();


    const seek = this.audioSeek.current;
    seek.addEventListener('mouseup', e => e.target.blur());
    this.audioSeek.current.addEventListener('change', e => this.props.player.seek(seek.value));
  }

  render({player}, {playState}) {
    return (
      <div>
        <span>{getPlayStateMessage(playState)}</span>
        <input type="button" value="Play" onClick={() => player.play()}/>
        <input type="button" value="Pause" onClick={() => player.pause()}/>
        <input type="button" value="Stop" onClick={() => player.stop()}/>
        <input type="button" value="Prev" onClick={() => player.previous()}/>
        <input type="button" value="Next" onClick={() => player.next()}/>
        <input type="range" ref={this.audioSeek}/>
        <audio ref={this.audioTagRef}/>
      </div>
    );
  }

}

export default MediaPlayerView;
