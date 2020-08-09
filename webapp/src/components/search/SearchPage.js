import {Component} from 'preact';
import PropTypes from 'prop-types';

import {catalog} from '../../Harmony';
import {classList} from '../../core/utils';
import {fromSearchUrlData, routeSearch} from './queryParams';
import {ArtistResult, ReleaseResult, SongResult, PlaylistResult} from './searchResults';

import style from './SearchPage.scss';

const CATEGORY_CONFIG = Object.freeze({
  artists: {view: ArtistResult, previewSize: 3},
  releases: {view: ReleaseResult, previewSize: 5},
  songs: {view: SongResult, previewSize: 12},
  playlists: {view: PlaylistResult, previewSize: 4}
});

function routeSingleSearchCategory(currentQuery, targetCategory) {
  const {text, modifiers} = fromSearchUrlData(currentQuery);
  routeSearch(text, [{key: `${targetCategory}-only`}, ...modifiers]);
}

class SearchPage extends Component {

  static PropTypes = {
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
    const singleCategory = results != null && Object.keys(results).length === 1 && Object.keys(results)[0];
    const commonProps = {query, results};

    return results && (
      <div class={classList(style.searchPage, updatingQuery && style.updating)}>
        {singleCategory !== false ? (
          <div>
            <ResultGroup {...commonProps} category={singleCategory}/>
          </div>
        ) : (
          <div>
            <ResultGroup {...commonProps} preview category="artists" name="Artists"/>
            <ResultGroup {...commonProps} preview category="releases" name="Releases"/>
            <ResultGroup {...commonProps} preview category="songs" name="Songs"/>
            <ResultGroup {...commonProps} preview category="playlists" name="Playlists"/>
          </div>
        )}
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

const ResultGroup = ({query, results, preview, category, name}) => {
  const data = results[category];
  const ResultView = CATEGORY_CONFIG[category].view;

  return data != null && data.length > 0 && (
    <div className={style.resultGroup}>
      {name && <h3>{name}</h3>}
      <div>
        {data
          .sort(resultSorter)
          .slice(0, preview ? CATEGORY_CONFIG[category].previewSize : undefined)
          .map(r => <ResultView key={r.id} content={r}/>)}
      </div>
      {preview && <span onClick={() => routeSingleSearchCategory(query, category)}>more {name}</span>}
    </div>
  );
};

const resultSorter = (a, b) => {
  const diff = b.weight - a.weight;
  return diff !== 0 ? diff :
    (a.name || a.title).localeCompare(b.name || b.title);
}

export default SearchPage;
