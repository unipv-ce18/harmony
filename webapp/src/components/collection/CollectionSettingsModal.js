import {Component} from 'preact';

import styles from '../SettingsModal.scss';
import ModalBox from '../modalbox/ModalBox'
import {ModalBoxTypes} from '../modalbox/ModalBox';

class CollectionSettingsModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      modalBox : {type:'', message:''}
    };
  }

  deleteCollectionPage() {
    this.props.removeCollection();
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    let modalBox = this.state.modalBox;
    return (
      <div>
        <div class={styles.settingsModal}>
          <div class={styles.settingsButton}>
            {this.props.type === 'release' &&
            <div>
              <label htmlFor="upload">Upload image
                <input type="file" id="upload" style="display:none"
                  onChange={e => this.props.uploadImage(e.target.files[0])}/>
              </label>
            </div>}
            <div><button onClick={()=>{this.props.modifyPage(true); this.props.handleSettingsModal(false)}}>
              Modify your {this.props.type}</button></div>
            <div><button onClick={this.handleModalBox.bind(this,
              ModalBoxTypes.MODALBOX_CONFIRM_DELETE, 'Do you really want to delete this ' + this.props.type + '?')}>
              Delete your {this.props.type}
            </button></div>
            <div><button onClick={this.props.handleSettingsModal.bind(this, false)}>Cancel</button></div>
          </div>
        </div>
        {modalBox.type &&
          <ModalBox
            type={modalBox.type}
            message={modalBox.message}
            handleCancel={()=>{this.handleModalBox('', '')}}
            handleSubmit={this.deleteCollectionPage.bind(this)}
            />}
      </div>
    );
  }
}

export default CollectionSettingsModal;
