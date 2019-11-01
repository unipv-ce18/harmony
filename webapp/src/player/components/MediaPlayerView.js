import {Component, createRef} from 'preact';

class MediaPlayerView extends Component {

  audioARef = createRef();
  audioBRef = createRef();

  componentDidMount() {
    this.props.onLoaded({bTag: this.audioARef.current, aTag: this.audioBRef.current});
  }

  render() {
    return (
      <div>
        <i>Ciao, musica maestro!</i>
        <audio ref={this.audioARef}/>
        <audio ref={this.audioBRef}/>
      </div>
    );
  }

}

export default MediaPlayerView;
