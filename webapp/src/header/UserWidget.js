import {Component, createRef} from 'preact';

import {classList} from '../core/utils';
import {session} from '../Harmony';
import {DEFAULT_USER_IMAGE_URL} from '../assets/defaults';

import style from './UserWidget.scss';
import {userLink} from '../core/links';

const LEAVE_TIMEOUT_MS = 300;

class UserWidget extends Component {

  constructor() {
    super();
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  state = {
    user: null,
    dropdown: false,
    dropdownHeight: 0,
    imageLoaded: 'no'
  }

  #leaveTimeout = null;
  #navRef = createRef();

  componentDidMount() {
    this.setState({dropdownHeight: this.#navRef.current.clientHeight + 'px'});
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    const user = session.currentUser;
    if (user) this.setState({user})
  }

  render(props, {user, dropdown, dropdownHeight, imageLoaded}) {
    return (
      <div className={classList(style.userWidget, dropdown && `drop-down`)} style={{'--dd-height': dropdownHeight}}
           onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <div>
          {user && [
            <span>{user.username}</span>,
            <img src={imageLoaded !== 'err' ? (user.image || DEFAULT_USER_IMAGE_URL) : DEFAULT_USER_IMAGE_URL} alt=""
                 onload={() => imageLoaded === 'no' && this.setState({imageLoaded: 'yes'})}
                 onError={() => this.setState({imageLoaded: 'err'})}
                 style={imageLoaded === 'no' && {opacity: 0}}/>
          ]}
        </div>
        <div>
          <div ref={this.#navRef} onClick={() => this.setState({dropdown: false})}>
          <a href={userLink(user?.id)}>My profile</a>
          <a href="#" onClick={e => {e.preventDefault(); session.doLogout();}}>Log out</a>
          </div>
        </div>
      </div>
    );
  }

  onMouseEnter(_) {
    if (this.#leaveTimeout != null) {
      clearTimeout(this.#leaveTimeout);
      this.#leaveTimeout = null;
    } else {
      this.setState({dropdown: true});
    }
  }

  onMouseLeave(_) {
    this.#leaveTimeout = setTimeout(() => {
      this.setState({dropdown: false});
      this.#leaveTimeout = null;
    }, LEAVE_TIMEOUT_MS);
  }

}

export default UserWidget;
