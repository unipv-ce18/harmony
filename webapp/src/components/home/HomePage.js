import {Component} from 'preact';

import {session, mediaPlayer} from '../../Harmony';
import {MediaItemInfo} from "../../player/MediaPlayer";

class HomePage extends Component {
  render(props, state, context) {
    // Behold the almighty home page of Harmony!
    return (
      <div>
        <button onClick={() => session.doLogout()}>Logout</button>
        <button onClick={() => mediaPlayer.play(new MediaItemInfo('dummy', null))}>Include shit & play</button>
      </div>
    );
  }
}

export default HomePage;
