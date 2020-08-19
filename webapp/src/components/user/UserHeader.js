import {Component} from 'preact';

import {session} from '../../Harmony';
import {deleteUser} from '../../core/apiCalls';
import SettingsModal from '../SettingsModal'
import IconButton from '../IconButton';
import {IconSettings} from '../../assets/icons/icons';
import {DEFAULT_USER_IMAGE_URL} from '../../assets/defaults';

import styles from './UserPage.scss';

class UserHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      update : false,
      settingsModal : false,
      settingsType: ''
    };

    this.updatePage = this.updatePage.bind(this);
    this.confirmModification = this.confirmModification.bind(this);
    this.cancelModification = this.cancelModification.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.setState({bio : this.props.user.biography});
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.biography !== prevProps.user.biography)
      this.setState({bio: [...this.props.user.biography]});
  }

  updatePage() {
    this.setState({update : true});
  }

  cancelModification() {
    this.setState({update : false});
  }

  confirmModification(e) {
    e.preventDefault();
    let bio = this.state.bio;
    this.props.user.updateBiography(bio)
      .then(() => this.setState({update: false}))
      .catch(() => session.error = true);
  }

  removeUser() {
    session.getAccessToken()
      .then(token => deleteUser(token, this.props.user.id))
      .then(() => session.doLogout())
      .catch(() => session.error = true);
  }

  handleChange({target}) {
    this.setState({
      [target.name]: target.value
    });
  }

  isUserOwner() {
    return session.currentUser?.id === this.props.user.id;
  }

  uploadUserImage(file) {
    this.props.user.updateImage(file)
      .then(() => this.setState({settingsModal: false}))
      .catch(() => session.error = true);
  }

  handleSettingsModal(isOpen, type) {
    this.setState({settingsModal: isOpen});
    this.setState({settingsType: type});
  }

  render({user}, {bio, update, settingsModal, settingsType}) {
    return (
      <div class={styles.userTop}>
        <div class={styles.image}>
        {this.isUserOwner()
         ? <button onClick={this.handleSettingsModal.bind(this, true, 'image')}>
             <img src={user.image ? user.image : DEFAULT_USER_IMAGE_URL} alt=""/>
           </button>
         : <img src={user.image ? user.image : DEFAULT_USER_IMAGE_URL} alt=""/>}
        </div>
        <div>
          <div class={styles.top}>
            <h2 class={styles.name}>{user.username}</h2>
            {this.isUserOwner() && !update &&
              <div>
                <button onClick={this.updatePage}>Modify your personal info</button>
                <IconButton
                  size={30}
                  name="Settings"
                  icon={IconSettings}
                  onClick={this.handleSettingsModal.bind(this, true, 'user')}/>
              </div>}
          </div>
          {(this.state.bio && !update)
            ? <div className={styles.userBio}>{bio}</div>
            : this.state.update
              ? <form>
                  <input
                    type="text"
                    name="bio"
                    value={bio}
                    placeholder="Enter your new bio"
                    onChange={this.handleChange}
                  />
                  <button onClick={this.cancelModification}>Cancel</button>
                  <button onClick={this.confirmModification}>Update!</button>
                </form>
              : null
          }
        </div>
        {settingsModal &&
        <SettingsModal
          handleSettingsModal={this.handleSettingsModal.bind(this)}
          type={settingsType}
          removeUser={this.removeUser.bind(this)}
          uploadImage={this.uploadUserImage.bind(this)}
          logout={() => session.doLogout()}/>}
      </div>
    );
  }
}

export default UserHeader;
