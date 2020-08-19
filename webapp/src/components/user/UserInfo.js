import {Component} from 'preact';

import styles from './UserPage.scss';
import {route} from 'preact-router';
import {session} from '../../Harmony';
import {artistLink, userLibraryLink} from '../../core/links';
import {createArtist} from '../../core/apiCalls';
import UserHeader from './UserHeader';
import ArtistList from './ArtistList';
import ModalBox, {ModalBoxTypes} from '../modalbox/ModalBox';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen} from '../../assets/icons/icons';
import {DEFAULT_NEW_CONTENT_IMAGE_URL} from '../../assets/defaults';

class UserInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {modalBox : {type:'', message:''}};

    this.changeType = this.changeType.bind(this);
    this.changeTier = this.changeTier.bind(this);
    this.clickLibrary = this.clickLibrary.bind(this);
    this.changeEmailPrefs = this.changeEmailPrefs.bind(this);
  }

  componentDidMount() {
    const {user} = this.props;
    this.setState({
      email: user.preferences.private.email,
      type: user.type,
      tier: user.tier
    })
  }

  componentDidUpdate(prevProps) {
    const {user} = this.props;
    if (user.preferences.private.email !== prevProps.user.preferences.private.email)
      this.setState({email: [...this.props.user.preferences.private.email]});
    if (user.type !== prevProps.user.type)
      this.setState({type: [...this.props.user.type]});
    if (user.tier !== prevProps.user.tier)
      this.setState({tier: [...this.props.user.tier]});
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

  createNewArtist(temp_artist_name) {
    let artist_name = temp_artist_name;
    if (!artist_name) artist_name = 'New Artist';
    session.getAccessToken()
      .then(token => {
        createArtist(artist_name, token)
          .then(result => route(artistLink(result['artist_id'])))
          .catch(() => session.error = true);
      });
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

  handleModalBox(modalbox_type, message, e) {
    e.preventDefault();
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    const user = this.props.user;
    const modalBox = this.state.modalBox;

    return(
      <div>
        <div class={styles.userInfo}>
          <UserHeader user={user}/>
          <div class={styles.userCenter}>
            <p>Account info</p>
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
            <div>Type: {this.state.type}</div>
            <div>Tier: {this.state.tier}</div>
          </div>
          <div>
            {this.state.type !== 'creator' && this.isUserOwner() &&
              <button onClick={this.changeType}>Become a creator!</button>}
            {this.state.tier !== 'pro' && this.isUserOwner() &&
              <button onClick={this.changeTier}>Become a pro user!</button>}
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
        </div>

        {modalBox.type &&
        <ModalBox
          type={modalBox.type}
          message={modalBox.message}
          placeholder={modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? 'Artist Name' : ''}
          handleCancel={()=>this.handleModalBox('', '')}
          handleSubmit={
            modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? this.createNewArtist.bind(this) : null}
          />}
      </div>
    );
  }
}

export default UserInfo;
