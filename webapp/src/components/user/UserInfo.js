import {Component} from 'preact';

import styles from './UserPage.scss';
import {route} from 'preact-router';
import {session} from '../../Harmony';
import {userLibraryLink} from '../../core/links';
import {
  patchUser,
  deleteUser,
  uploadContent,
  uploadToStorage
} from '../../core/apiCalls';
import ArtistList from './ArtistList';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen, IconSettings} from '../../assets/icons/icons';
import {DEFAULT_USER_IMAGE_URL} from '../../assets/defaults';
import SettingsModal from '../SettingsModal';

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
    const {user} = this.props;
    this.setState({
      email: user.preferences.private.email,
      type: user.type,
      tier: user.tier,
      bio: user.bio
    })
  }

  componentDidUpdate(prevProps) {
    const {user} = this.props;
    if (user.preferences.private.email !== prevProps.user.preferences.private.email)
      this.setState({email: [...user.preferences.private.email]});
    if (user.type !== prevProps.user.type)
      this.setState({type: [...user.type]});
    if (user.tier !== prevProps.user.tier)
      this.setState({tier: [...user.tier]});
    if (user.bio !== prevProps.user.bio)
      this.setState({bio: [...user.bio]});
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
    const prefs = this.props.user.preferences;
    const newEmail = !this.state.email;
    prefs.private.email = newEmail;  // Ehm this also changes current props, nevermind

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
  }

  confirmModification(e) {
    e.preventDefault();
    let bio = this.state.bio;
    session.getAccessToken()
      .then (token => {
        patchUser(token, this.props.user.id, {bio})
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
            session.doLogout();
          })
          .catch( () => session.error = true);
      })
  }

  handleChange({target}) {
    this.setState({
      [target.name]: target.value
    });
  }

  uploadUserImage(mimetype, size, filename) {
    session.getAccessToken()
      .then (token => {
        uploadContent('user', 'me', mimetype, size, token)
          .then(result => {
            uploadToStorage(result, filename);
            this.setState({settingsModal : false});
          })
          .catch( () => session.error = true);
      })
  }

  handleSettingsModal(isOpen, type) {
    this.setState({settingsModal: isOpen});
    this.setState({settingsType: type});
  }




  render() {
    const user = this.props.user;

    return(
      <div>
        <div class={styles.userInfo}>
          <div className={styles.userTop}>
            <div className={styles.image}>
              {this.isUserOwner()
                ? <button onClick={this.handleSettingsModal.bind(this, true, 'image')}>
                  <img src={user.avatar_url ? user.avatar_url : DEFAULT_USER_IMAGE_URL} alt={""}/>
                </button>
                : <img src={user.avatar_url ? user.avatar_url : DEFAULT_USER_IMAGE_URL} alt={""}/>}
            </div>
            <div>
              <div className={styles.top}>
                <h2 className={styles.name}>{user.username}</h2>
                {this.isUserOwner() && !this.state.update &&
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
                    name={this.state.email ? "Make it public" : "Make it private"}
                    icon={this.state.email ? IconLockClose : IconLockOpen}
                    onClick={this.changeEmailPrefs}/>}
                </div>}
                <div class={styles.tagsList}>
                  <span>Type: {this.state.type}</span>
                  <span>Tier: {this.state.tier}</span>
                </div>
              </div>
              {(this.state.bio && !this.state.update)
                ? <div className={styles.userBio}>{this.state.bio}</div>
                : this.state.update
                  ? <form className={styles.userBio}>
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
          {!this.isUserOwner() &&
            <a href="#" onClick={this.clickLibrary}>Go to {user.username} library</a>}
          {this.state.type === 'creator' &&
            <div class={styles.artists}>
              Artists
              {user.ownArtists && user.ownArtists.length > 0 &&
                <ArtistList artists={user.ownArtists}/>}
              {this.isUserOwner() &&
                <div class={styles.artistList}>
                  <div class={styles.artist}>
                    <a href='#'
                       onClick={this.handleModalBox.bind(this, ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Artist')}>
                      <img src={DEFAULT_NEW_CONTENT_IMAGE_URL} alt={""}/>
                    </a>
                    <p><a href='#'
                          onClick={this.handleModalBox.bind(this, ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Artist')}>
                      New Artist
                    </a></p>
                  </div>
              </div>}
            </div>}
            <ArtistList artists={user.artists} isUserOwner={this.isUserOwner()} />}

          {this.isUserOwner() &&
          <div className={styles.userBottom}>
            {this.state.type !== 'creator' &&
            <button onClick={this.changeType}>Become a creator!</button>}
            {this.state.tier !== 'pro' &&
            <button onClick={this.changeTier}>Become a pro user!</button>}
          </div>}
        </div>
        {this.state.settingsModal &&
          <SettingsModal
            handleSettingsModal={this.handleSettingsModal.bind(this)}
            type={this.state.settingsType}
            updatePage={this.updatePage}
            removeUser={this.removeUser.bind(this)}
            uploadImage={this.uploadUserImage.bind(this)}
            logout={() => session.doLogout()}/>}
      </div>
    );
  }
}

export default UserInfo;
