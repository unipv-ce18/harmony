import {Component} from 'preact';

import style from './MiniPlayer.scss';

/**
 * Alternate view for the {@link MiniPlayer}, used when expanded and not in {@link PagePlayer}
 */
class MiniViewAlternate extends Component {

  render({refs, flipCtx: Flip}) {
    return (
      <div class={style.altView}>
        <Flip.Node ref={refs.trackTitle} group="mini-player" tag="track-title" scale>
          <div>Best Song</div>
        </Flip.Node>
        <Flip.Node ref={refs.trackArtist} group="mini-player" tag="track-artist" scale>
          <div>A Fancy Artist</div>
        </Flip.Node>
      </div> // TODO
    );
  }

}

export default MiniViewAlternate;
