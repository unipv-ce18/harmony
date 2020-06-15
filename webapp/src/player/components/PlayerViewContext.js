import {Component, createContext} from 'preact';
import PropTypes from 'prop-types';

import style from './player_styledefs.scss';
import {FlipContext} from './animations';
import PlayerEvents from '../PlayerEvents';
import MediaPlayerCore from '../MediaPlayerCore';

const PlayerViewContext = createContext();

const FLIP_ANIMATION_OPTIONS_DEFAULT = {duration: parseInt(style.playerTransitionLen), easing: 'ease', fill: 'none'};

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
    player: PropTypes.instanceOf(MediaPlayerCore).isRequired,
    /** {@link MediaPlayerView} UI component */
    view: PropTypes.object,
    /** Children elements using this context */
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ])
  }

  flipContext = new FlipContext(FLIP_RULES);

  state = {
    playState: null,
    currentMedia: null
  }

  constructor() {
    super();
    this.onPlayerStateChange = this.onPlayerStateChange.bind(this);
    this.onPlayerTrackChange = this.onPlayerTrackChange.bind(this);
  }

  componentDidMount() {
    const player = this.props.player;
    player.addEventListener(PlayerEvents.STATE_CHANGE, this.onPlayerStateChange);
    player.addEventListener(PlayerEvents.NEW_MEDIA, this.onPlayerTrackChange);
  }

  componentWillUnmount() {
    const player = this.props.player;
    player.removeEventListener(PlayerEvents.STATE_CHANGE, this.onPlayerStateChange);
    player.removeEventListener(PlayerEvents.NEW_MEDIA, this.onPlayerTrackChange);
  }

  render({player, view: playerView, children}, {playState, currentMedia}) {
    return (
      <PlayerViewContext.Provider value={{player, playerView, playState, currentMedia, flipContext: this.flipContext}}>
        {children}
      </PlayerViewContext.Provider>
    )
  }

  onPlayerStateChange(e) {
    this.setState({playState: e.detail.newState});
  }

  onPlayerTrackChange(e) {
    this.setState({
      currentMedia: {
        mediaInfo: this.props.player.currentMediaInfo,
        length: e.detail.res.duration
      }
    });
  }

}

export const PlayerViewContextConsumer = PlayerViewContext.Consumer;
