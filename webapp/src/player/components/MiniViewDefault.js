import {Component} from 'preact';

import OverflowWrapper from './OverflowWrapper';
import IconButton from '../../components/IconButton';
import {IconPause, IconPlay} from '../../assets/icons/icons';
import {fadeIn, fadeOut} from '../../components/animations';
import {PlayerViewContextConsumer, FlipTags, FLIP_GROUP_MINI_PLAYER} from './PlayerViewContext';
import PlayStates from '../PlayStates';

import style from './MiniPlayer.scss';

const ANIMATION_LENGTH = parseInt(style.playerTransitionLen);
const ANIMATION_LENGTH_SHORT = parseInt(style.playerTransitionLenShort);

/**
 * Default view for the {@link MiniPlayer}, used when minimized
 */
class MiniViewDefault extends Component {

  constructor() {
    super();
    this.onPlayClickHandler = this.onPlayClickHandler.bind(this);
  }

  componentWillLeave(done) {
    // Fade out the icon, instantly hide the rest (media labels will flip-animate to their target view)
    const [icon, ...rest] = this.base.children;
    rest.forEach(e => e.style.visibility = 'hidden');
    fadeOut(icon, null, ANIMATION_LENGTH_SHORT, 0, 'none').onfinish = done;
  }

  componentWillEnter(done) {
    // Fade in the icon, don't touch media labels (they flip in by themselves); fade in separator at the end
    const els = this.base.children;
    fadeIn(els[0], null, ANIMATION_LENGTH_SHORT, 0, 'none');  // Icon
    fadeIn(els[1].getElementsByClassName(style.separator)[0], null, ANIMATION_LENGTH, ANIMATION_LENGTH);  // Separator
    setTimeout(done, ANIMATION_LENGTH);
  }

  render({refs}, state, {playState, currentMedia, flipContext: Flip}) {
    const playing = playState === PlayStates.PLAYING;
    return (
      <div class={style.defaultView}>
        <IconButton name={playing ? "Pause" : "Play"} icon={playing ? IconPause : IconPlay}
                    size={28} onClick={this.onPlayClickHandler}/>
        {currentMedia &&
        <OverflowWrapper viewportClass={style.labelsVp}>
          <Flip.Node ref={refs.trackTitle} group={FLIP_GROUP_MINI_PLAYER} tag={FlipTags.TRACK_TITLE} scale>
            <div>{currentMedia.mediaInfo.title}</div>
          </Flip.Node>
          <span class={style.separator}/>
          <Flip.Node ref={refs.trackArtist} group={FLIP_GROUP_MINI_PLAYER} tag={FlipTags.TRACK_ARTIST} scale>
            <div>{currentMedia.mediaInfo.artist}</div>
          </Flip.Node>
        </OverflowWrapper>
        }
      </div>
    );
  }

  onPlayClickHandler(e) {
    e.stopPropagation();
    const player = this.context.player;
    this.context.playState === PlayStates.PLAYING ? player.pause() : player.play();
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default MiniViewDefault;
