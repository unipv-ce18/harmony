import {Component} from 'preact';

import {session, mediaPlayer} from '../../Harmony';
import {MediaItemInfo, PlayStartModes} from "../../player/MediaPlayer";

import style from './HomePage.scss';

class HomePage extends Component {
  render(props, state, context) {
    // Behold the almighty home page of Harmony!
    return (
      <div class={style.homepage}>
        {/* Temporary player controls */}
        <button onClick={() => session.doLogout()}>Logout</button>
        <button onClick={() => mediaPlayer.play(new MediaItemInfo('test1d', null), PlayStartModes.APPEND_PLAYLIST)}>Include shit</button>
        <button onClick={() => mediaPlayer.play([
            new MediaItemInfo('test1d', null),
            new MediaItemInfo('test2d', null)
          ], PlayStartModes.APPEND_PLAYLIST_AND_PLAY)}>Include shit & play</button>
      </div>
    );
  }
}

export default HomePage;
