import {Component, createContext} from 'preact';
import PropTypes from 'prop-types';

import style from './player_styledefs.scss';
import {FlipContext} from './animations';

const PlayerViewContext = createContext();

const FLIP_ANIMATION_OPTIONS_DEFAULT = {duration: parseInt(style.playerTransitionLen), easing: 'ease', fill: 'both'};

export const FLIP_GROUP_MINI_PLAYER = 'mini-player';
export const FLIP_GROUP_PAGE_PLAYER = 'page-player';

export const FlipTags = Object.freeze({
  TRACK_TITLE: 'track-title',
  TRACK_ARTIST: 'track-artist'
})

// Describes allowed transitions for FLIP and corresponding options passed to Element.animate()
const FLIP_RULES = {
  // Mini player can transition from page or from itself (mode switch)
  [FLIP_GROUP_MINI_PLAYER]: {
    [FLIP_GROUP_PAGE_PLAYER]: FLIP_ANIMATION_OPTIONS_DEFAULT,
    [FLIP_GROUP_MINI_PLAYER]: FLIP_ANIMATION_OPTIONS_DEFAULT,
  },
  // Page can transition from mini player group
  [FLIP_GROUP_PAGE_PLAYER]: {
    [FLIP_GROUP_MINI_PLAYER]: FLIP_ANIMATION_OPTIONS_DEFAULT,
  }
}

export class PlayerViewContextProvider extends Component {

  static propTypes = {
    /** {@link MediaPlayerCore} instance */
    player: PropTypes.func,
    /** {@link MediaPlayerView} UI component */
    view: PropTypes.func,
    /** Children elements using this context */
    children: PropTypes.arrayOf(PropTypes.node)
  }

  flipContext = new FlipContext(FLIP_RULES);

  render({player, view, children}) {
    return (
      <PlayerViewContext.Provider value={{player, playerView: view, flipContext: this.flipContext}}>
        {children}
      </PlayerViewContext.Provider>
    )
  }

}

export const PlayerViewContextConsumer = PlayerViewContext.Consumer;
