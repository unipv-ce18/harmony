import {Component, createRef} from 'preact';

import IconButton from './IconButton';
import {IconPause, IconPlay} from '../../assets/icons/icons';
import {fadeIn, fadeOut} from './animations';
import {PlayerViewContextConsumer, FlipTags, FLIP_GROUP_MINI_PLAYER} from './PlayerViewContext';
import PlayStates from '../PlayStates';

import style from './MiniPlayer.scss';

const ANIMATION_LENGTH = parseInt(style.playerTransitionLen);
const ANIMATION_LENGTH_SHORT = parseInt(style.playerTransitionLenShort);

/**
 * Default view for the {@link MiniPlayer}, used when minimized
 */
class MiniViewDefault extends Component {

  viewRef = createRef();

  constructor() {
    super();
    this.onPlayClickHandler = this.onPlayClickHandler.bind(this);
  }

  componentWillLeave(done) {
    // Fade out the icon, instantly hide the rest (media labels will flip-animate to their target view)
    const [icon, ...rest] = this.viewRef.current.children;
    rest.forEach(e => e.style.visibility = 'hidden');
    fadeOut(icon, null, ANIMATION_LENGTH_SHORT, 0, 'none').onfinish = done;
  }

  componentWillEnter(done) {
    // Fade in the icon, don't touch media labels (they flip in by themselves); fade in separator at the end
    const els = this.viewRef.current.children;
    fadeIn(els[0], null, ANIMATION_LENGTH_SHORT, 0, 'none').onfinish = done;  // Icon
    fadeIn(els[2], null, ANIMATION_LENGTH, ANIMATION_LENGTH);  // Separator
  }

  render({refs}, state, {playState, currentMedia, flipContext: Flip}) {
    const playing = playState === PlayStates.PLAYING;
    return (
      <div ref={this.viewRef} class={style.defaultView}>
        <IconButton name={playing ? "Pause" : "Play"} icon={playing ? IconPause : IconPlay}
                    size={28} onClick={this.onPlayClickHandler}/>
        <Flip.Node ref={refs.trackTitle} group={FLIP_GROUP_MINI_PLAYER} tag={FlipTags.TRACK_TITLE} scale>
          <div>{currentMedia && currentMedia.mediaInfo.title}</div>
        </Flip.Node>
        <span class={style.separator}/>
        <Flip.Node ref={refs.trackArtist} group={FLIP_GROUP_MINI_PLAYER} tag={FlipTags.TRACK_ARTIST} scale>
          <div>{currentMedia && currentMedia.mediaInfo.artist}</div>
        </Flip.Node>
      </div>
    );
  }

  onPlayClickHandler(e) {
    e.stopPropagation();
    const player = this.context.player;
    if (this.context.playState === PlayStates.PLAYING) {
      console.log('pausing');
      player.pause();
    } else {
      console.log('staritng');
      player.play();
    }
    //this.context.playState === PlayStates.PLAYING && player.pause() || player.play();
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default MiniViewDefault;
