import {h, Component} from 'preact';

import HeaderBar from './header/HeaderBar';
import Search from "./search/Search";

class Homepage extends Component {
  render() {
    return (
      <div>
        <HeaderBar page="homepage"/>
        <Search />
        {/*//<Additional />*/}
        {/*//<Footer />*/}
      </div>
    );
  }
}

export default Homepage;
