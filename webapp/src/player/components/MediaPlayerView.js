import {Component, createRef} from 'preact';

import {session} from '../../Harmony';

import MediaSessionPlugin from '../plugins/MediaSessionPlugin';
import SizeControls from './SizeControls';
import PlayerFrame from './PlayerFrame';
import {PlayerViewContextProvider} from './PlayerViewContext';
import {fadeIn} from './animations';

import style from './PlayerFrame.scss';

const TRANSITION_TIME = parseInt(style.playerTransitionLenShort);

class MediaPlayerView extends Component {

  audioTagRef = createRef();

  state = {
    expanded: false,
    pinned: false
  }

  componentDidMount() {
    const player = this.props.player;
    player.initialize(this.audioTagRef.current, session);
    player.addPlugin(new MediaSessionPlugin())
    this.setState({playState: player.playbackState});
    this.props.onLoaded();

    fadeIn(this.base, [0, 10], TRANSITION_TIME, 0, 'none');
  }

  render({player}, {expanded, playState}) {
    return (
      <div class={style.playerContainer} tabIndex={0}
           onClick={() => this.#expanded = true} onBlur={() => this.#expanded = false}>
        <PlayerViewContextProvider player={player} view={this}>
          <SizeControls enabled={expanded}>
            <PlayerFrame expanded={expanded}/>
          </SizeControls>
        </PlayerViewContextProvider>
        <audio ref={this.audioTagRef}/>
      </div>
    );
  }

  set pinned(pinned) {
    if (this.state.pinned !== pinned)
      this.setState({pinned});
  }

  get pinned() {
    return this.state.pinned;
  }

  set #expanded(expanded) {
    if (this.state.pinned && expanded === false) {
      // Do not collapse if pinned
      return;
    }

    if (this.state.expanded !== expanded)
      this.setState({expanded});
  }

  get expanded() {
    return this.state.expanded;
  }

}

export default MediaPlayerView;
