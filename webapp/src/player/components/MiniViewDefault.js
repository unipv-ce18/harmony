import {Component, createRef} from 'preact';

import IconButton from './IconButton';
import {IconPause, IconPlay} from '../../assets/icons/icons';

import style from './MiniPlayer.scss';
import {fadeIn, fadeOut} from './animations';

const ANIMATION_LENGTH = parseInt(style.playerTransitionLen);
const ANIMATION_LENGTH_SHORT = parseInt(style.playerTransitionLenShort);

/**
 * Default view for the {@link MiniPlayer}, used when minimized
 */
class MiniViewDefault extends Component {

  viewRef = createRef();

  state = {
    DUMMYplaying: false  // TODO: Replace with playback info from context when implemented
  }

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

  render({refs, flipCtx: Flip}, {DUMMYplaying}) {
    // TODO: Get media labels content from player context
    return (
      <div ref={this.viewRef} class={style.defaultView}>
        <IconButton name={DUMMYplaying ? "Pause" : "Play"} icon={DUMMYplaying ? IconPlay : IconPause}
                    size={28} onClick={this.onPlayClickHandler}/>
        <Flip.Node ref={refs.trackTitle} group="mini-player" tag="track-title">
          <div>Best Song</div>
        </Flip.Node>
        <span class={style.separator}/>
        <Flip.Node ref={refs.trackArtist} group="mini-player" tag="track-artist">
          <div>A Fancy Artist</div>
        </Flip.Node>
      </div>
    );
  }

  onPlayClickHandler(e) {
    e.stopPropagation();
    this.setState({DUMMYplaying: !this.state.DUMMYplaying})
  }

}

export default MiniViewDefault;
