import {Component} from 'preact';
import {route} from 'preact-router';

import {session} from '../../Harmony';
import {userLibraryLink} from '../../core/links';
import {deleteUser} from '../../core/apiCalls';
import ArtistList from './ArtistList';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen, IconSettings} from '../../assets/icons/icons';
import {DEFAULT_USER_IMAGE_URL} from '../../assets/defaults';
import SettingsModal from '../SettingsModal';

import styles from './UserPage.scss';

class UserInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      update : false,
      settingsModal : false,
      settingsType: ''
    };

    this.changeType = this.changeType.bind(this);
    this.changeTier = this.changeTier.bind(this);
    this.clickLibrary = this.clickLibrary.bind(this);
    this.changeEmailPrefs = this.changeEmailPrefs.bind(this);

    this.updatePage = this.updatePage.bind(this);
    this.confirmModification = this.confirmModification.bind(this);
    this.cancelModification = this.cancelModification.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.setAttributesStates();
  }

  setAttributesStates() {
    const {user} = this.props;
    this.setState({
      email: user.preferences.private.email,
      type: user.type,
      tier: user.tier,
      bio: user.biography
    })
  }

  changeType() {
    this.props.user.upgradeType()
      .then(() => this.setState({type: 'creator'}))
      .catch(() => session.error = true);
  }

  changeTier() {
    this.props.user.upgradeTier()
      .then(() => this.setState({tier: 'pro'}))
      .catch(() => session.error = true);
  }

  changeEmailPrefs() {
    const newEmail = !this.state.email;
    const prefs = {private: {email: newEmail}}

    this.props.user.updatePreferences(prefs)
      .then(() => this.setState({email: newEmail}))
      .catch(() => session.error = true);
  }

  clickLibrary(e) {
     e.preventDefault();
     route(userLibraryLink(this.props.user.id));
  }

  isUserOwner() {
    return session.currentUser?.id === this.props.user.id;
  }

  updatePage() {
    this.setState({update : true});
  }

  cancelModification() {
    this.setState({update : false});
    this.setAttributesStates();
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

  uploadUserImage(file) {
    this.props.user.updateImage(file)
      .then(() => this.setState({settingsModal: false}))
      .catch(() => session.error = true);
  }

  handleSettingsModal(isOpen, type) {
    this.setState({settingsModal: isOpen});
    this.setState({settingsType: type});
  }

  render({user}, {bio, email, type, tier, update, settingsModal, settingsType}) {
    return(
      <div>
        <div class={styles.userInfo}>
          <div className={styles.userTop}>
            <div className={styles.image}>
              {this.isUserOwner()
                ? <button onClick={this.handleSettingsModal.bind(this, true, 'image')}>
                  <img src={user.image ? user.image : DEFAULT_USER_IMAGE_URL} alt=""/>
                </button>
                : <img src={user.image ? user.image : DEFAULT_USER_IMAGE_URL} alt=""/>}
            </div>
            <div>
              <div className={styles.top}>
                <h2 className={styles.name}>{user.username}</h2>
                {this.isUserOwner() && !update &&
                <div>
                  <IconButton
                    size={30}
                    name="Settings"
                    icon={IconSettings}
                    onClick={this.handleSettingsModal.bind(this, true, 'user')}/>
                </div>}
              </div>
              <div className={styles.userCenter}>
                {user.email &&
                <div>
                  E-mail: {user.email} &nbsp;&nbsp;
                  {this.isUserOwner() &&
                  <IconButton
                    size={20}
                    name={email ? "Make it public" : "Make it private"}
                    icon={email ? IconLockClose : IconLockOpen}
                    onClick={this.changeEmailPrefs}/>}
                </div>}
                <div class={styles.tagsList}>
                  <span title="Account type">{type}</span>
                  <span title="Account tier">{tier}</span>
                </div>
              </div>
              {(bio && (!update
                ? <div className={styles.userBio}>{bio}</div>
                : <form className={styles.userBio}>
                    <input
                      type="text"
                      name="bio"
                      value={bio}
                      placeholder="Enter your new bio"
                      onChange={this.handleChange}
                    />
                    <button onClick={this.cancelModification}>Cancel</button>
                    <button onClick={this.confirmModification}>Update!</button>
                  </form>))
              }
            </div>
          </div>
          {!this.isUserOwner() &&
            <a href="#" onClick={this.clickLibrary}>Go to {user.username} library</a>}
          {type === 'creator' &&
            <ArtistList artists={user.ownArtists} isUserOwner={this.isUserOwner()} />}

          {this.isUserOwner() &&
          <div className={styles.userBottom}>
            {type !== 'creator' &&
            <button onClick={this.changeType}>Become a creator!</button>}
            {tier !== 'pro' &&
            <button onClick={this.changeTier}>Become a pro user!</button>}
          </div>}
        </div>
        {settingsModal &&
          <SettingsModal
            handleSettingsModal={this.handleSettingsModal.bind(this)}
            type={settingsType}
            updatePage={this.updatePage}
            removeUser={this.removeUser.bind(this)}
            uploadImage={this.uploadUserImage.bind(this)}
            logout={() => session.doLogout()}/>}
      </div>
    );
  }
}

export default UserInfo;
