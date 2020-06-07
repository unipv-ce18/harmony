import {Component, createRef} from 'preact';
import {TransitionGroup} from 'preact-transition-group/src/TransitionGroup';
import PropTypes from 'prop-types';

import MiniViewDefault from './MiniViewDefault';
import MiniViewAlternate from './MiniViewAlternate';
import style from './MiniPlayer.scss';

/**
 * Minimized (and player page footer) media view and controls
 */
class MiniPlayer extends Component {

  static propTypes = {
    /** Display mode */
    mode: PropTypes.number,
    /** Context for flip animations */
    flipCtx: PropTypes.func
  }

  refs = {
    trackTitle: createRef(),
    trackArtist: createRef()
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    // Save location for FLIP early if we are switching between DEFAULT and ALTERNATE
    // otherwise the expand/collapse animation will mess up client rect calculations
    if (this.props.mode !== MiniPlayer.Mode.HIDDEN && this.props.mode !== nextProps.mode) {
      this.refs.trackTitle.current.saveCurrentLocation();
      this.refs.trackArtist.current.saveCurrentLocation();
    }
  }

  render({mode, flipCtx}) {
    const MiniView = MODE_COMPONENTS[mode];
    return (
      <TransitionGroup class={style.miniPlayer}>
        {MiniView && <MiniView refs={this.refs} flipCtx={flipCtx}/>}
      </TransitionGroup>
    );
  }

}

MiniPlayer.Mode = Object.freeze({
  DEFAULT: 0,    // When minimized, has play button and track info
  ALTERNATE: 1,  // When in other pages, shows seekbar behind (centered) track info
  HIDDEN: 2      // When in player page, controls are already visible there
});

// Binds modes to their view components
const MODE_COMPONENTS = {
  [MiniPlayer.Mode.DEFAULT]: MiniViewDefault,
  [MiniPlayer.Mode.ALTERNATE]: MiniViewAlternate,
  [MiniPlayer.Mode.HIDDEN]: null
}

export default MiniPlayer;
