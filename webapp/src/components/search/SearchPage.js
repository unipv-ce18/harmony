import {Component} from 'preact';
import PropTypes from 'prop-types';

import {catalog} from '../../Harmony';
import {classList} from '../../core/utils';
import {fromSearchUrlData} from './queryParams';
import {ArtistResult, ReleaseResult, SongResult, PlaylistResult} from './searchResults';

import style from './SearchPage.scss';

class SearchPage extends Component {

  static PropTypes = {
    /** Type of search */
    type: PropTypes.string.isRequired,
    /** Search query to perform */
    query: PropTypes.string.isRequired
  }

  state = {
    query: null,  // The current query
    results: null,  // Results for the current query
    updatingQuery: null  // Query for the next/pending search results
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    this.#performSearch();
  }

  render(props, {query, results, updatingQuery}) {
    return results && (
      <div class={classList(style.searchPage, updatingQuery && style.updating)}>
        {/*<div>{SearchTypes[type].name} results for: "{query}"</div>*/}
        <div>
          <ResultGroup name="Artists" type='artists' elementView={ArtistResult} results={results}/>
          <ResultGroup name="Releases" type='releases' elementView={ReleaseResult} results={results}/>
          <ResultGroup name="Songs" type='songs' elementView={SongResult} results={results}/>
          <ResultGroup name="Playlists" type='playlists' elementView={PlaylistResult} results={results}/>
        </div>
        {/*//<Footer />*/}
      </div>
    );
  }

  #performSearch() {
    const query = this.props.query;

    // Do nothing if results for current parameters are already displaying
    if (this.state.query === query) return;

    // Do nothing if a search for these parameters is already being performed
    const updatingQuery = this.state.updatingQuery;
    if (updatingQuery != null && updatingQuery === query) return;

    // Do the search
    const {text, modifiers} = fromSearchUrlData(this.props.query);  // If this throws nothing happens
    this.setState({updatingQuery: query})
    catalog.search(text, modifiers)
      .then(results => this.setState({query, results, updatingQuery: null}))
  }
}

const ResultGroup = ({name, type, results, elementView: ElView}) => {
  return results[type] && results[type].length > 0 && (
    <div class={style.resultGroup}>
      <h3>{name}</h3>
      <div>
        {results[type].map(item => <ElView key={item.id} content={item}/>)}
      </div>
    </div>
  )
}

export default SearchPage;
