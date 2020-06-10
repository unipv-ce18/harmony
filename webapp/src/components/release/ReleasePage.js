import {Component} from 'preact';

import ErrorPage from '../error/ErrorPage';
import ReleasePageComposed from './ReleasePageComposed';
import {getLibrary, getRelease} from "../../core/apiCalls";
import {session} from "../../Harmony"
import {route} from "preact-router";

class ReleasePage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      error: false,
      valid: false
    };
  }

  componentDidMount() {
    return session.getAccessToken()
      .then (token => {
        getRelease(/[^/]*$/.exec(window.location.href)[0], true, token)
          .then(result => {
            this.setState({release: result});
            this.setState({valid: true});
          })
          .catch( e => {
            this.setState({error: true});
          });
      })
  }

  render() {
    return (
      <div>
        {this.state.error ? <ErrorPage/> : (this.state.valid ? <ReleasePageComposed release={this.state.release}/> : "")}
      </div>);
  }
}

export default ReleasePage;
