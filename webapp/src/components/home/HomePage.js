import {Component} from 'preact';

import SearchInput from "../search/SearchInput";
import styles from './HomePage.scss';

import {session, mediaPlayer} from '../../Harmony';
import {MediaItemInfo, PlayStartModes} from "../../player/MediaPlayer";

class HomePage extends Component {
  render(props, state, context) {
    // Behold the almighty home page of Harmony!
    return (
      <div class={styles.homepage}>
        <SearchInput autofocus/>

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
