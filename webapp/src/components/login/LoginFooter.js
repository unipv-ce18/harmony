import {Component} from "preact";

import {getRandomMessage} from './randomMessages';

import style from './LoginFooter.scss';

// Note: currently preact-transition-group does not like preact-hooks

class LoginFooter extends Component {

  state = {message: getRandomMessage()};

  render(props, {message}) {
    return (
      <div class={style.loginFooter}>
        <em onclick={e => e.target.href === undefined && this.setState({message: getRandomMessage()})}>{message}</em>
        <VersionInfo/>
        <p>&copy; 2021 Disposable Koalas</p>
      </div>
    );
  }

}

class VersionInfo extends Component {

  state = {
    backendVersion: null,
    error: false
  }

  componentDidMount() {
    this.setState({backendVersion: null});
    fetch(API_BASE_URL + '/sayhello')
      .then(r => r.json())
      .then(d => this.setState({backendVersion: d.version}))
      .catch(_ => this.setState({backendVersion: 'OFFLINE', error: true}));
  }

  render(props, {backendVersion, error}) {
    return backendVersion !== null
      ? <p>
          Webapp: {WEBAPP_VERSION} — Backend: <span onClick={() => this.componentDidMount()} title="Reconnect"
                                                    class={error ? style.error : ''}>{backendVersion}</span>
        </p>
      : <p>Webapp: {WEBAPP_VERSION}</p>;
  }

}

export default LoginFooter;
