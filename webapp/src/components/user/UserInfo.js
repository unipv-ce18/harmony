import {Component} from 'preact';

import styles from './UserPage.scss';
import {route} from 'preact-router';
import {session} from '../../Harmony';
import {changeUserType, changeUserTier, createArtist} from '../../core/apiCalls';
import UserHeader from './UserHeader';
import ArtistList from './ArtistList';
import ModalBox from '../ModalBox';
import IconButton from '../IconButton';
import {IconLockClose, IconLockOpen} from '../../assets/icons/icons';
import image from '../../assets/plus.jpg';

const MODALBOX_ARTIST = 'modalbox_artist';
const MODAL_BOX_SUCCESS = 'modalbox_success';

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
    this.setState({email : this.props.user.prefs.private.email});
    this.setState({type : this.props.user.type});
    this.setState({tier : this.props.user.tier});
  }

  componentDidUpdate(prevProps) {
    if (this.props.user.prefs.private.email !== prevProps.user.prefs.private.email)
      this.setState({email: [...this.props.user.prefs.private.email]});
    if (this.props.user.type !== prevProps.user.type)
      this.setState({type: [...this.props.user.type]});
    if (this.props.user.tier !== prevProps.user.tier)
      this.setState({tier: [...this.props.user.tier]});
  }

  componentWillUnmount() {

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
          .then(result => {
            this.setState({tier: 'pro'});
          })
          .catch( () => session.error = true);
      })
  }

  createNewArtist(artist_name) {
    session.getAccessToken()
      .then (token => {
        createArtist(artist_name, token)
          .then(result => {
            route('/artist/' + result['artist_id']);
          })
          .catch( () => session.error = true);
      })
  }

  changeEmailPrefs() {
    session.getAccessToken()
      .then (token => {
        let prefs = this.props.user.prefs;
        prefs['private']['email'] = !this.state.email;
        patchUser(token, this.props.user.id, null, prefs)
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

  handleModalBox(modalbox_type, message, e) {
    e.preventDefault();
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    const user = this.props.user;

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
              {user.artists && user.artists.length > 0 &&
                <ArtistList artists={user.artists}/>}
              {this.isUserOwner() &&
                <div class={styles.artistList}>
                  <div class={styles.artist}>
                    <a href='#' onClick={this.handleModalBox.bind(this, MODALBOX_ARTIST, '')}>
                      <img src={image} alt={""}/>
                    </a>
                    <p><a href='#' onClick={this.handleModalBox.bind(this, MODALBOX_ARTIST, '')}>New Artist</a></p>
                  </div>
              </div>}
            </div>}
        </div>
        <ModalBox
          handleModalBox={this.handleModalBox.bind(this)}
          newArtist={this.createNewArtist.bind(this)}
          type={this.state.modalBox.type}
          message={this.state.modalBox.message}/>
      </div>
    );
  }
}

export default UserInfo;
