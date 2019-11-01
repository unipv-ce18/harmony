import {Component} from 'preact';

/**
 * Conditionally renders a media player if its module has been dynamically loaded
 */
class MediaPlayerWrapper extends Component {

  state = {playerView: null};

  loadPromiseResolver = null;

  constructor(props) {
    super(props);
    props.playerLoader.loadListener = this.onPlayerLoad.bind(this);
  }

  onPlayerLoad() {
    // This promise resolves when the actual player mounts
    const loadPromise = new Promise(resolve => this.loadPromiseResolver = resolve);

    import(/* webpackChunkName: "player" */ './MediaPlayerView')
      .then(m => this.setState({playerView: m.default}));

    return loadPromise;
  }

  render({playerLoader}, {playerView}) {
    // noinspection UnnecessaryLocalVariableJS
    const PlayerView = playerView; // need to be Pascal case to be interpreted as JSX component
    if (PlayerView !== null)
      return (<PlayerView onLoaded={this.loadPromiseResolver}/>);
    else
      return null;
  }

}

export default MediaPlayerWrapper;
