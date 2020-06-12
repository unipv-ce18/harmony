import {Component} from 'preact';
import {PlayerViewContextConsumer, FlipTags, FLIP_GROUP_MINI_PLAYER} from './PlayerViewContext';

import style from './MiniPlayer.scss';

/**
 * Alternate view for the {@link MiniPlayer}, used when expanded and not in {@link PagePlayer}
 */
class MiniViewAlternate extends Component {

  render({refs}, state, {flipContext: Flip}) {
    return (
      <div class={style.altView}>
        <Flip.Node ref={refs.trackTitle} group={FLIP_GROUP_MINI_PLAYER} tag={FlipTags.TRACK_TITLE} scale>
          <div>Best Song</div>
        </Flip.Node>
        <Flip.Node ref={refs.trackArtist} group={FLIP_GROUP_MINI_PLAYER} tag={FlipTags.TRACK_ARTIST} scale>
          <div>A Fancy Artist</div>
        </Flip.Node>
      </div> // TODO
    );
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default MiniViewAlternate;
