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
    this.openFile = this.openFile.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
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

  uploadImage() {
    let f = this.state.file;
    this.props.uploadImage(f.type, f.size, f.name);
  }

  openFile(file) {
    this.setState({file: file[0]}, () => {
        this.uploadImage();
      }
    );
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    let modalBox = this.state.modalBox;
    return (
      <div>
        {this.props.type === 'user' &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={this.handleModalBox.bind(this,
                MODALBOX_USER_DELETE, 'Do you really want to delete your account?')}>
                Delete your account
              </button></div>
              <div><button onClick={this.logout}>Log out</button></div>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
            </div>
          </div>}
          {this.props.type === 'image' &&
            <div class={styles.settingsModal}>
              <div class={styles.settingsButton}>
                <div>
                  <label for="upload">Upload image
                    <input type="file" id="upload" style="display:none"
                      onChange={(event)=> {
                        this.openFile(event.target.files);
                      }}
                    />
                  </label>
                </div>
                <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
              </div>
            </div>}
        {this.props.type === 'artist' &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Modify your page</button></div>
              <div><button onClick={this.handleModalBox.bind(this,
                MODALBOX_ARTIST_DELETE, 'Do you really want to delete this artist?')}>
                Delete your page
              </button></div>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
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
