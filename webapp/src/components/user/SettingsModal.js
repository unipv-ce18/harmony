import {Component} from 'preact';

import styles from './SettingsModal.scss';
import ModalBox from '../ModalBox'


const MODALBOX_USER_DELETE = 'modalbox_user_delete'

class SettingsModal extends Component {

  constructor(props) {
    super(props);

    this.state = {modalBox : {type:'', message:''}};

    this.logout = this.logout.bind(this);
  }

  removeUser() {
    //this.props.removeUser();
  }

  logout() {
    this.props.logout();
  }

  handleModalBox(modalbox_type, message, e) {
    e.preventDefault();
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    return (
      <div>
        {this.props.open &&
          <div class={styles.settingsModal}>
            <div class={styles.settingsButton}>
              <div><button onClick={this.handleModalBox.bind(this, MODALBOX_USER_DELETE, '')}>Delete your account</button></div>
              <div><button onClick={this.logout}>Log out</button></div>
              <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
            </div>
          </div>}
        <ModalBox
          handleModalBox={this.handleModalBox.bind(this)}
          removeUser={this.removeUser.bind(this)}
          type={this.state.modalBox.type}
          message={this.state.modalBox.message}/>
      </div>
    );
  }
}

export default SettingsModal;
