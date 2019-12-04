import {Component} from 'preact';
import {route} from 'preact-router';

import styles from './search.scss';

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {value: '', type: 'all'};
    this.handleChangeValue = this.handleChangeValue.bind(this);
    this.handleChangeType = this.handleChangeType.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChangeValue(event) {
    this.setState({value: event.target.value});
  }

  handleChangeType(event) {
    this.setState({type: event.target.value});
  }

  handleSubmit(event) {
    route('/search/' + this.state.type +  '/' + this.state.value.replace(/[^a-z0-9]/gi, ' ').replace(/ /g, '+'));
    event.preventDefault();
  }

  render() {
    return(
      <div class={styles.search}>
        <form onSubmit={this.handleSubmit}>
          <select value={this.state.type} onChange={this.handleChangeType} class={styles.searchSelect}>
            <option value='all' selected>All</option>
            <option value='songs'>Songs</option>
            <option value='artists'>Artists</option>
            <option value='albums'>Albums</option>
          </select>
          <input type='text' name='search' class={styles.searchLine} value={this.state.value} onChange={this.handleChangeValue}/>
          <button type='submit' class={styles.searchButton} ></button>
        </form>
      </div>
    );
  }
}

export default Search;
