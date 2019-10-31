import {h, Component} from 'preact';

import HeaderBar from '../header/HeaderBar';
import albums from './testAlbums';
import songs from './testSongs';
import ResultsSearch from './ResultsSearch';

class SearchPage extends Component {
  render() {
    let results = albums.concat(songs);
    return (
      <div>
        <HeaderBar page="search"/>
        <ResultsSearch results = {results}/>
        {/*//<Footer />*/}
      </div>
    );
  }
}

export default SearchPage;
