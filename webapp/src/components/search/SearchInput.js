import {Component} from 'preact';
import PropTypes from 'prop-types';
import {route} from 'preact-router';

import {SearchTypes} from '../../core/MediaCatalog';

import styles from './SearchInput.scss';

const INPUT_SEARCH_DELAY = 500;

const filterInput = text => text.replace(/[^a-z0-9]/gi, ' ').replace(/ /g, '+');

// Stupid hack to "respect time constraints" - sync state between home and search page input using a global
let searchContext = null;

class SearchInput extends Component {

  static propTypes = {
    /** If this input should get autofocus on mount */
    autofocus: PropTypes.bool
  }

  state = {
    query: '',
    type: 'any'
  }

  #searchTimeout = null;

  constructor(props) {
    super(props);
    this.handleChangeValue = this.handleChangeValue.bind(this);
    this.handleChangeType = this.handleChangeType.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    if (this.props.autofocus)
      this.base.querySelector('input[type=text]').focus();
    searchContext && this.setState(searchContext);
  }

  handleChangeValue(event) {
    this.setState({query: event.target.value}, () => {
      this.#searchTimeout && clearTimeout(this.#searchTimeout);
      this.#searchTimeout = setTimeout(() => this.#performSearch(), INPUT_SEARCH_DELAY);
    });
  }

  handleChangeType(event) {
    this.setState({type: event.target.value}, () => this.handleSubmit(null));
  }

  handleSubmit(event) {
    event && event.preventDefault();
    this.#searchTimeout && clearTimeout(this.#searchTimeout);
    this.#performSearch();
  }

  render(props, {type, query}) {
    return (
      <div class={styles.search}>
        <form onSubmit={this.handleSubmit}>
          <select value={type} onChange={this.handleChangeType} class={styles.searchSelect}>
            {Object.keys(SearchTypes).map(
              key => <option value={key} selected={key === type}>{SearchTypes[key].name}</option>
            )}
          </select>
          <input type='text' name='search' class={styles.searchLine} value={query}
                 onChange={this.handleChangeValue}/>
          <button type='submit' class={styles.searchButton}/>
        </form>
      </div>
    );
  }

  #performSearch() {
    const {type, query} = this.state;
    this.#searchTimeout = null;
    if (this.state.query !== '') {
      searchContext = this.state;
      route('/search/' + type + '/' + filterInput(query));
    }
  }
}

export default SearchInput;
