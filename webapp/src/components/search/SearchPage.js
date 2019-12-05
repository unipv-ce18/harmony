import {Component} from 'preact';

import results from './test';
import ResultsSearch from './ResultsSearch';
import styles from './SearchPage.scss';


class SearchPage extends Component {
  render({type, query}) {
    return (
      <div>
        <div>Results for: "{query.replace(/\+/g, ' ')}" - Type Search: {type}</div>
        <ResultsSearch results = {results} type = {this.props.type}/>
        {/*//<Footer />*/}
      </div>
    );
  }
}

export default SearchPage;
