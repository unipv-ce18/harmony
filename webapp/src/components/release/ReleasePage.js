import {Component} from 'preact';

import ErrorPage from '../error/ErrorPage';
import ReleasePageComposed from './ReleasePageComposed';
import {getRelease} from "../../core/apiCalls";
import {route} from "preact-router";

class ReleasePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: false,
      release: {
        artist: {id: '', name: ''},
        songs: []
      }
    };

  }

  componentDidMount() {
    getRelease(/[^/]*$/.exec(window.location.href)[0], true)
      .then(result => {
        this.setState({release: result});
      })
      .catch( e => {
        this.setState({error: true});
      });
  }

  render() {
    return (
      <div>
        {this.state.error ? <ErrorPage/> : <ReleasePageComposed release={this.state.release}/>}
      </div>);
  }
}

export default ReleasePage;
