import {Component, createRef} from 'preact';

import {classList} from '../core/utils';
import {session} from '../Harmony';
import {DEFAULT_USER_IMAGE_URL} from '../assets/defaults';

import style from './UserWidget.scss';

const LEAVE_TIMEOUT_MS = 300;

class UserWidget extends Component {

  constructor() {
    super();
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  state = {
    userData: null,
    dropdown: false,
    dropdownHeight: 0
  }

  #leaveTimeout = null;
  #navRef = createRef();

  componentDidMount() {
    this.setState({dropdownHeight: this.#navRef.current.clientHeight + 'px'});
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    const userData = session.getOwnData();
    if (userData) this.setState({userData})
  }

  render(props, {userData, dropdown, dropdownHeight}) {
    return (
      <div className={classList(style.userWidget, dropdown && `drop-down`)} style={{'--dd-height': dropdownHeight}}
           onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <div>
          <span>{userData?.username}</span>
          <img src={DEFAULT_USER_IMAGE_URL} alt=""/>
        </div>
        <div>
          <div ref={this.#navRef} onClick={() => this.setState({dropdown: false})}>
          <a href="/user/me">My profile</a>
          <a href="#" onClick={e => {e.preventDefault(); session.doLogout();}}>Log out</a>
          </div>
        </div>
      </div>
    );
  }

  onMouseEnter(e) {
    if (this.#leaveTimeout != null) {
      clearTimeout(this.#leaveTimeout);
      this.#leaveTimeout = null;
    } else {
      this.setState({dropdown: true});
    }
  }

  onMouseLeave(e) {
    this.#leaveTimeout = setTimeout(() => {
      this.setState({dropdown: false});
      this.#leaveTimeout = null;
    }, LEAVE_TIMEOUT_MS);
  }

}

export default UserWidget;
