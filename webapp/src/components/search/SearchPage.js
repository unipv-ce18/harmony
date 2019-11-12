import {Component} from 'preact';

import albums from '../../testAlbums';
import songs from '../../testSongs';
import ResultsSearch from './ResultsSearch';

class SearchPage extends Component {
  render({query}) {
    let results = albums.concat(songs);
    return (
      <div>
        <div>Results for: "{query.replace(/\+/g, ' ')}"</div>
        <ResultsSearch results = {results}/>
        {/*//<Footer />*/}
      </div>
    );
  }
}

export default SearchPage;
