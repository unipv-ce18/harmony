import {Component} from 'preact';
import PropTypes from 'prop-types';

import {catalog} from '../../Harmony';
import {SearchTypes} from '../../core/MediaCatalog';
import {classList} from '../../core/utils';
import SongResult from "./SongResult";
import ReleaseResult from "./ReleaseResult";
import ArtistResult from "./ArtistResult";

import style from './SearchPage.scss';

class SearchPage extends Component {

  static PropTypes = {
    /** Type of search */
    type: PropTypes.string.isRequired,
    /** Search query to perform */
    query: PropTypes.string.isRequired
  }

  state = {
    // Data for the current search results
    type: null, query: null, results: null,
    // Data for the next/pending search results
    updating: null
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    this.#performSearch();
  }

  render(props, {type, query, results, updating}) {
    return results && (
      <div class={classList(style.searchPage, updating && style.updating)}>
        <div>{SearchTypes[type].name} results for: "{query}"</div>
        <div>
          <ResultGroup name="Artists" type='artists' elementView={ArtistResult} results={results}/>
          <ResultGroup name="Releases" type='releases' elementView={ReleaseResult} results={results}/>
          <ResultGroup name="Songs" type='songs' elementView={SongResult} results={results}/>
          {/*<ResultGroup name="Playlists" type='playlists' elementView={TO DO} results={results}/>*/}
        </div>
        {/*//<Footer />*/}
      </div>
    );
  }

  #performSearch() {
    const {type, query: rawQuery} = this.props;
    const query = rawQuery.replace(/\+/g, ' ');

    // Do nothing if results for current parameters are already displaying
    if (this.state.type === type && this.state.query === query)
      return;

    // Do nothing if a search for these parameters is already being performed
    const updating = this.state.updating;
    if (updating != null && updating.type === type && updating.query === query)
      return;

    // Do the search
    this.setState({updating: {type, query}})
    catalog.search(type, query)
      .then(results => this.setState({type, query, results, updating: null}))
  }
}

const ResultGroup = ({name, type, results, elementView: ElView}) => {
  return results[type] && results[type].length > 0 && (
    <div>
      <h1>{name}</h1>
      {results[type].map(item => <ElView key={item.id} content={item}/>)}
    </div>
  )
}

export default SearchPage;
