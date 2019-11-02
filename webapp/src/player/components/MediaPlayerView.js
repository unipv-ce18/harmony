import {Component, createRef} from 'preact';
import PlayStates from '../PlayStates';

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

  audioARef = createRef();
  audioBRef = createRef();
  audioSeek = createRef();

  constructor(props) {
    super(props);
    props.player.playbackEngine.addEventListener('statechange',
      e => this.setState({playState: e.detail.newState}));
  }

  componentDidMount() {
    this.props.onLoaded({bTag: this.audioARef.current, aTag: this.audioBRef.current});

    this.props.player.playbackEngine.addEventListener('timeupdate', e => {
      const audioSeek = this.audioSeek.current;
      if (document.activeElement !== audioSeek) {
        audioSeek.max = e.detail.end;
        audioSeek.value = e.detail.cur;
      }
    });

    const seek = this.audioSeek.current;
    seek.addEventListener('mouseup', e => e.target.blur());
    this.audioSeek.current.addEventListener('change', e => this.props.player.playbackEngine.seek(seek.value));
  }

  render({player}, {playState}) {
    return (
      <div>
        <span>{getPlayStateMessage(playState)}</span>
        <input type="button" value="Play" onClick={() => player.play()}/>
        <input type="button" value="Pause" onClick={() => player.playbackEngine.pause()}/>
        <input type="button" value="Stop" onClick={() => player.playbackEngine.stop()}/>
        <input type="button" value="Prev" onClick={() => player.previous()}/>
        <input type="button" value="Next" onClick={() => player.next()}/>
        <input type="range" ref={this.audioSeek}/>
        <audio ref={this.audioARef}/>
        <audio ref={this.audioBRef}/>
      </div>
    );
  }

}

export default MediaPlayerView;
