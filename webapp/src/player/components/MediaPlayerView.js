import {Component, createRef} from 'preact';

import {session} from '../../Harmony';

import MediaSessionPlugin from '../plugins/MediaSessionPlugin';
import WaveformLoaderPlugin from '../plugins/WaveformLoaderPlugin';
import SizeControls from './SizeControls';
import PlayerFrame from './PlayerFrame';
import {PlayerViewContextProvider} from './PlayerViewContext';
import {fadeIn} from './animations';

import style from './PlayerFrame.scss';

const TRANSITION_TIME = parseInt(style.playerTransitionLenShort);
const COLLAPSE_TIMEOUT_MS = 500;

class MediaPlayerView extends Component {

  audioTagRef = createRef();

  state = {
    expanded: false,
    pinned: false
  }

  #collapseTimeout = null;

  constructor() {
    super();
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  componentDidMount() {
    const player = this.props.player;
    player.initialize(this.audioTagRef.current, session);
    player.addPlugin(new MediaSessionPlugin())
    player.addPlugin(new WaveformLoaderPlugin())
    this.setState({playState: player.playbackState});
    this.props.onLoaded();

    fadeIn(this.base, [0, 10], TRANSITION_TIME, 0, 'none');
  }

  render({player}, {expanded, playState}) {
    return (
      <div class={style.playerContainer} tabIndex={0} onClick={() => expanded || this.setState({expanded: true})}
           onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <PlayerViewContextProvider player={player} view={this}>
          <SizeControls enabled={expanded}>
            <PlayerFrame expanded={expanded}/>
          </SizeControls>
        </PlayerViewContextProvider>
        <audio ref={this.audioTagRef}/>
      </div>
    );
  }

  onMouseEnter(e) {
    if (!this.state.expanded) return;  // Do nothing if player collapsed (expand on click)

    if (this.#collapseTimeout != null) {
      clearTimeout(this.#collapseTimeout);
      this.#collapseTimeout = null;
    } else {
      this.setState({expanded: true});
    }
  }

  onMouseLeave(e) {
    if (!this.state.expanded || this.state.pinned) return;  // Do not collapse if pinned

    this.#collapseTimeout = setTimeout(() => {
      this.#collapseTimeout = null;
      this.setState({expanded: false});
    }, COLLAPSE_TIMEOUT_MS);
  }

  set pinned(pinned) {
    if (this.state.pinned !== pinned)
      this.setState({pinned});
  }

  get pinned() {
    return this.state.pinned;
  }

  get expanded() {
    return this.state.expanded;
  }

}

export default MediaPlayerView;
