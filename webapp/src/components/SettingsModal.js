import {Component} from 'preact';

import styles from './SettingsModal.scss';
import ModalBox from './ModalBox'

const MODALBOX_ARTIST_DELETE = 'modalbox_artist_delete'
const MODALBOX_USER_DELETE = 'modalbox_user_delete'

class SettingsModal extends Component {

  constructor(props) {
    super(props);

    this.state = {modalBox : {type:'', message:''}};

    this.logout = this.logout.bind(this);
  }

  removeUser() {
    this.props.removeUser();
  }

  logout() {
    this.props.logout();
  }

  deleteArtistPage() {
    this.props.removeArtist();
  }

  handleModalBox(modalbox_type, message, e) {
    e.preventDefault();
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    return (
      <div>
        {this.props.open && this.props.type === 'user' &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={this.handleModalBox.bind(this, MODALBOX_USER_DELETE, '')}>Delete your account</button></div>
              <div><button onClick={this.logout}>Log out</button></div>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
            </div>
          </div>}
        {this.props.open && this.props.type === 'artist' &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Modify your page</button></div>
              <div><button onClick={this.handleModalBox.bind(this, MODALBOX_ARTIST_DELETE, '')}>Delete your page</button></div>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
            </div>
          </div>}
        <ModalBox
          handleModalBox={this.handleModalBox.bind(this)}
          removeUser={this.removeUser.bind(this)}
          removeArtist={this.deleteArtistPage.bind(this)}
          type={this.state.modalBox.type}
          message={this.state.modalBox.message}/>
      </div>
    );
  }
}

export default SettingsModal;
