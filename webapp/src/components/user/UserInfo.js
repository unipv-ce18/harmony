import {Component} from 'preact';

import styles from './UserPage.scss';
import {route} from 'preact-router';
import {session} from '../../Harmony';
import {
  changeUserType,
  changeUserTier,
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
    this.setState({email : this.props.user.prefs.private.email});
    this.setState({type : this.props.user.type});
    this.setState({tier : this.props.user.tier});
    this.setState({bio : this.props.user.bio});
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.prefs.private.email !== prevProps.user.prefs.private.email)
      this.setState({email: [...this.props.user.prefs.private.email]});
    if (this.props.user.type !== prevProps.user.type)
      this.setState({type: [...this.props.user.type]});
    if (this.props.user.tier !== prevProps.user.tier)
      this.setState({tier: [...this.props.user.tier]});
    if (this.props.user.bio !== prevProps.user.bio)
      this.setState({bio: [...this.props.user.bio]});
  }

  changeType() {
    session.getAccessToken()
      .then (token => {
        changeUserType(token)
          .then(() => {
            this.setState({type: 'creator'});
          })
          .catch( () => session.error = true);
      })
  }

  changeTier() {
    session.getAccessToken()
      .then (token => {
        changeUserTier(token)
          .then(() => {
            this.setState({tier: 'pro'});
          })
          .catch( () => session.error = true);
      })
  }

  changeEmailPrefs() {
    session.getAccessToken()
      .then (token => {
        let prefs = this.props.user.prefs;
        prefs['private']['email'] = !this.state.email;
        patchUser(token, this.props.user.id, {prefs})
          .then( () => {
            this.setState({email : !this.state.email});
          })
          .catch( () => session.error = true);
      })
  }

  clickLibrary(e) {
     e.preventDefault();
     route('/library/' + this.props.user.id);
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.user.id;
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
            {this.state.settingsModal &&
            <SettingsModal
              handleSettingsModal={this.handleSettingsModal.bind(this)}
              type={this.state.settingsType}
              updatePage={this.updatePage}
              removeUser={this.removeUser.bind(this)}
              uploadImage={this.uploadUserImage.bind(this)}
              logout={() => session.doLogout()}/>}
          </div>
          {!this.isUserOwner() &&
            <a href="#" onClick={this.clickLibrary}>Go to {user.username} library</a>}
          {this.state.type === 'creator' &&
            <ArtistList artists={user.artists} isUserOwner={this.isUserOwner()} />}

          {this.isUserOwner() &&
          <div className={styles.userBottom}>
            {this.state.type !== 'creator' &&
            <button onClick={this.changeType}>Become a creator!</button>}
            {this.state.tier !== 'pro' &&
            <button onClick={this.changeTier}>Become a pro user!</button>}
          </div>}
        </div>
      </div>
    );
  }
}

export default UserInfo;
