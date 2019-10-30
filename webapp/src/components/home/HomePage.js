import {Component} from 'preact';

import {sessionInstance} from "../../App";

class HomePage extends Component {
  render(props, state, context) {
    // Behold the almighty home page of Harmony!
    return (
      <button onClick={() => sessionInstance.doLogout()}>Logout</button>
    )
  }
}

export default HomePage;
