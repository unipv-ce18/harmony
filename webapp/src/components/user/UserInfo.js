import {Component} from 'preact';
import {route} from 'preact-router';
import styles from './UserPage.scss';
import {session} from '../../Harmony';
import ArtistList from './ArtistList';
import {changeUserType, changeUserTier, patchUser} from '../../core/apiCalls';
import {DEFAULT_USER_IMAGE_URL} from '../../assets/defaults';

class UserInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {update : false};

    this.changeType = this.changeType.bind(this);
    this.changeTier = this.changeTier.bind(this);
    this.updatePage = this.updatePage.bind(this);
    this.confirmModification = this.confirmModification.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.clickLibrary = this.clickLibrary.bind(this);
  }

  componentDidMount() {
    this.setState({type : this.props.user.type});
    this.setState({tier : this.props.user.tier});
    this.setState({bio : this.props.user.bio});
  }

  componentDidUpdate(prevProps) {
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
      })
  }

  changeTier() {
    session.getAccessToken()
      .then (token => {
        changeUserTier(token)
          .then(result => {
            this.setState({tier: 'pro'});
          })
      })
  }

  createArtist() {

  }

  updatePage() {
    this.setState({update : true});
  }

  confirmModification() {
    session.getAccessToken()
      .then (token => {
        patchUser(token, this.props.user.id, this.state.bio)
          .then( () => {

          })
          .catch( () => session.error = true);
      })
    this.setState({update : false});
  }

  handleChange({target}) {
    this.setState({
      [target.name]: target.value
    });
  }

  clickLibrary(e) {
     e.preventDefault();
     route('/library/' + this.props.user.id);
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.user.id;
  }

  render() {
    const user = this.props.user;

    return(
      <div>
        <div class={styles.userInfo}>
          <div><img src={user.avatar_url ? user.avatar_url : DEFAULT_USER_IMAGE_URL} alt={""}/></div>
          <h2 class={styles.name}>{user.username}</h2>
          <div>email: {user.email}</div>
          <div>
            type: {this.state.type}
            {this.state.type !== 'creator' && <button onClick={this.changeType}>become creator</button>}
            {this.state.type === 'creator' && this.isUserOwner() &&
              <button onClick={this.createArtist}>create an artist</button>}
          </div>
          <div>
            tier: {this.state.tier}
            {this.state.tier !== 'pro' && <button onClick={this.changeTier}>become pro</button>}
          </div>
          {(user.bio && !this.state.update)
            ? <div className={styles.userBio}>bio: {user.bio}</div>
            : this.state.update
              ? <form>
                  <input
                    type="text"
                    name="bio"
                    placeholder="Enter your new bio"
                    onChange={this.handleChange}
                  />
                  <button onClick={this.confirmModification}>Update!</button>
                </form>
              : null
            }
          {!this.isUserOwner() &&
            <a href="#" onClick={this.clickLibrary}>{user.username} library</a>}
          {user.artists && user.artists.length > 0 &&
            <div>
              Artists: <ArtistList artists={user.artists}/>
            </div>
          }
          <div>
            {this.isUserOwner() && !this.state.update &&
            <button onClick={this.updatePage}>modify your personal info</button>}
          </div>
        </div>
      </div>
    );
  }
}

export default UserInfo;
