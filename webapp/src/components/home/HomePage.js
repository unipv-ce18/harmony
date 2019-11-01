import {Component} from 'preact';

import {session} from '../../Harmony';

class HomePage extends Component {
  render(props, state, context) {
    // Behold the almighty home page of Harmony!
    return (
      <button onClick={() => session.doLogout()}>Logout</button>
    )
  }
}

export default HomePage;
