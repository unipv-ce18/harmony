import {Component} from 'preact';

import style from './HomePage.scss';

class HomePage extends Component {
  render(props, state, context) {
    // Behold the almighty home page of Harmony!
    return (
      <div class={style.homepage}>
        {/* Nothin' for now */}
      </div>
    );
  }
}

export default HomePage;
