import {Component} from 'preact';
import {route} from 'preact-router';

import styles from './search.scss';

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    route('/search/' + this.state.value.replace(/[^a-z0-9]/gi, ' ').replace(/ /g, '+'));
    event.preventDefault();
  }

  render() {
    return(
      <div className={styles.search}>
        <form onSubmit={this.handleSubmit}>
          <input type='text' name='search' id='search' value={this.state.value} onChange={this.handleChange}/>
          <input type='submit' value='Search' />
        </form>
      </div>
    );
  }
}

export default Search;
