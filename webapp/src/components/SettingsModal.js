import {Component} from 'preact';

import styles from './SettingsModal.scss';
import ModalBox from './modalbox/ModalBox'
import {ModalBoxTypes} from './modalbox/ModalBox';

const MODALBOX_ARTIST_DELETE = 'modalbox_artist_delete'
const MODALBOX_USER_DELETE = 'modalbox_user_delete'

class SettingsModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      file: [],
      modalBox : {type:'', message:''}
    };

    this.logout = this.logout.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.deleteArtistPage = this.deleteArtistPage.bind(this);
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

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render({type, handleSettingsModal, uploadImage}, {modalBox}) {
    return (
      <div>
        {type === 'user' &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={this.handleModalBox.bind(this,
                MODALBOX_USER_DELETE, 'Do you really want to delete your account?')}>
                Delete your account
              </button></div>
              <div><button onClick={this.logout}>Log out</button></div>
              <div><button onClick={handleSettingsModal.bind(this, false)}>Cancel</button></div>
            </div>
          </div>}
          {type === 'image' &&
            <div class={styles.settingsModal}>
              <div class={styles.settingsButton}>
                <div>
                  <label htmlFor="upload">Upload image
                    <input type="file" id="upload" style="display:none"
                      onChange={e => uploadImage(e.target.files[0])}
                    />
                  </label>
                </div>
                <div><button onClick={handleSettingsModal.bind(this, false)}>Cancel</button></div>
              </div>
            </div>}
        {type === 'artist' &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={()=>{this.props.modifyPage(true); this.props.handleSettingsModal(false)}}>
                Modify your page</button></div>
              <div><button onClick={this.handleModalBox.bind(this,
                MODALBOX_ARTIST_DELETE, 'Do you really want to delete this artist?')}>
                Delete your page
              </button></div>
              <div><button onClick={handleSettingsModal.bind(this, false)}>Cancel</button></div>
            </div>
          </div>}
        {modalBox.type &&
          <ModalBox
            type={ModalBoxTypes.MODALBOX_CONFIRM_DELETE}
            message={modalBox.message}
            handleCancel={()=>{this.handleModalBox('', '')}}
            handleSubmit={
              modalBox.type === MODALBOX_USER_DELETE ? this.removeUser.bind(this) :
              modalBox.type === MODALBOX_ARTIST_DELETE ? this.deleteArtistPage.bind(this) : null}
            />}
      </div>
    );
  }
}

export default SettingsModal;
