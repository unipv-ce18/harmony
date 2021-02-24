import {Component} from 'preact';

import PlayerEvents from '../PlayerEvents';

/**
 * Conditionally renders a media player if its module has been dynamically loaded
 */
class MediaPlayerWrapper extends Component {

  state = {playerView: null};

  loadPromiseResolver = null;

  constructor(props) {
    super(props);
    this.onPlayerClose = this.onPlayerClose.bind(this);
    props.playerLoader.playerInitializer = this.onPlayerLoad.bind(this);
  }

  onPlayerLoad() {
    // This promise resolves when the actual player mounts
    const loadPromise = new Promise(resolve => this.loadPromiseResolver = resolve);

    import(/* webpackChunkName: "player" */ './MediaPlayerView')
      .then(m => this.setState({playerView: m.default}));

    this.props.playerLoader.instance.addEventListener(PlayerEvents.SHUTDOWN, this.onPlayerClose);
    return loadPromise;
  }

  onPlayerClose() {
    this.setState({playerView: null});
  }

  componentWillUnmount() {
    // If player gets unmounted by user logout, ensure graceful shutdown
    this.props.playerLoader.instance?.shutdown();
  }

  render({playerLoader}, {playerView: PlayerView}) {
    if (PlayerView !== null)
      return (<PlayerView player={playerLoader.instance} onLoaded={this.loadPromiseResolver}/>);
    else
      return null;
  }

}

export default MediaPlayerWrapper;
