import {Component} from "preact";

import {getRandomMessage} from './randomMessages';

import style from './LoginFooter.scss';

// Note: currently preact-transition-group does not like preact-hooks

class LoginFooter extends Component {

  state = {message: getRandomMessage()};

  render(props, {message}) {
    return (
      <div className={style.loginFooter}>
        <em onclick={e => e.target.href === undefined && this.setState({message: getRandomMessage()})}>{message}</em>
        <p>&copy; 2020 Disposable Koalas</p>
      </div>
    );
  }

}

export default LoginFooter;
