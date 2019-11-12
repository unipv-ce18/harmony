import {Component} from 'preact';

import albums from '../../testAlbums';
import songs from '../../testSongs';
import ResultsSearch from './ResultsSearch';

class SearchPage extends Component {
  render() {
    let results = albums.concat(songs);
    return (
      <div>
        <ResultsSearch results = {results}/>
        {/*//<Footer />*/}
      </div>
    );
  }
}

export default SearchPage;
