import {Component} from 'preact';

import styles from './UserPage.scss';
import {route} from 'preact-router';
import {session} from '../../Harmony';
import {patchUser, deleteUser} from '../../core/apiCalls';
import IconButton from '../IconButton';
import {IconSettings} from '../../assets/icons/icons';
import {DEFAULT_USER_IMAGE_URL} from '../../assets/defaults';

class UserHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {update : false};

    this.updatePage = this.updatePage.bind(this);
    this.confirmModification = this.confirmModification.bind(this);
    this.cancelModification = this.cancelModification.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.imageChange = this.imageChange.bind(this);
  }

  componentDidMount() {
    this.setState({bio : this.props.user.bio});
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.bio !== prevProps.user.bio)
      this.setState({bio: [...this.props.user.bio]});
  }

  updatePage() {
    this.setState({update : true});
  }

  cancelModification() {
    this.setState({update : false});
  }

  confirmModification(e) {
    e.preventDefault()
    session.getAccessToken()
      .then (token => {
        patchUser(token, this.props.user.id, this.state.bio, null)
          .then( () => {
            this.setState({update : false});
          })
          .catch( () => session.error = true);
      })
  }

  removeUser() {
    session.getAccessToken()
      .then (token => {
        deleteUser(token, this.props.user.id)
          .then( () => {
            route('/login');
          })
          .catch( () => session.error = true);
      })
  }

  handleChange({target}) {
    this.setState({
      [target.name]: target.value
    });
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.user.id;
  }

  imageChange() {
    alert('image upload coming soon');
  }

  render() {
    const user = this.props.user;

    return(
      <div class={styles.userTop}>
        <div class={styles.image}>
        {this.isUserOwner()
         ? <button onClick={this.imageChange}>
             <img src={user.avatar_url ? user.avatar_url : DEFAULT_USER_IMAGE_URL} alt={""}/>
           </button>
         : <img src={user.avatar_url ? user.avatar_url : DEFAULT_USER_IMAGE_URL} alt={""}/>}
        </div>
        <div>
          <div class={styles.top}>
            <h2 class={styles.name}>{user.username}</h2>
            {this.isUserOwner() && !this.state.update &&
              <div>
                <button onClick={this.updatePage}>Modify your personal info</button>
                <IconButton
                  size={30}
                  name="Settings"
                  icon={IconSettings}/>
              </div>}
          </div>
          {(this.state.bio && !this.state.update)
            ? <div className={styles.userBio}>{this.state.bio}</div>
            : this.state.update
              ? <form>
                  <input
                    type="text"
                    name="bio"
                    value={this.state.bio}
                    placeholder="Enter your new bio"
                    onChange={this.handleChange}
                  />
                  <button onClick={this.cancelModification}>Cancel</button>
                  <button onClick={this.confirmModification}>Update!</button>
                </form>
              : null
          }
        </div>
      </div>
    );
  }
}

export default UserHeader;
