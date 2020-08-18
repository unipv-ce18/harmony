import {Component} from 'preact';

import styles from './ModalBox.scss';
import PropTypes from 'prop-types';

export const ModalBoxTypes = Object.freeze({
  MODALBOX_ERROR : 'modalbox_error',
  MODALBOX_SUCCESS : 'modalbox_success',
  MODALBOX_CONFIRM_DELETE : 'modalbox_confirm_delete',
  MODALBOX_FORM_CREATE : 'modalbox_form_create',
  MODALBOX_FORM_UPDATE : 'modalbox_form_update'
});


class ModalBox extends Component {

  static propTypes = {
    /** The type of the modal box */
    type: PropTypes.string,
    /** The message of the modal box */
    message: PropTypes.string,
    /** The placeholder in the input component */
    placeholder: PropTypes.string,
    /** The cancel event handler */
    handleCancel: PropTypes.func,
    /** The submit event handler */
    handleSubmit: PropTypes.func
  }

  constructor(props) {
    super(props);

    this.state = {
      inputValue : ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({inputValue : e.target.value});
  }

  handleCancel() {
    this.props.handleCancel();
  }

  handleConfirm() {
    this.props.handleSubmit();
  }

  handleSubmit() {
    this.props.handleSubmit(this.state.inputValue);
  }

  render() {
    let type = this.props.type;
    let message = this.props.message;
    return (
      <div>
        <div className={styles.modalBox}>
          {(type === ModalBoxTypes.MODALBOX_SUCCESS || type === ModalBoxTypes.MODALBOX_ERROR) ?
          <div className={type === ModalBoxTypes.MODALBOX_SUCCESS ? styles.modalSuccess : styles.modalError}>
            <p>{message}</p>
          </div>
          :
          <div>
            <button
              onClick={this.handleCancel}>&times;
            </button>
            {type === ModalBoxTypes.MODALBOX_CONFIRM_DELETE &&
            <div>
              <p>{message}</p>
              <button onClick={this.handleCancel}>Cancel</button>
              <button onClick={this.handleConfirm}>Delete</button>
            </div>}
            {(type === ModalBoxTypes.MODALBOX_FORM_CREATE || type === ModalBoxTypes.MODALBOX_FORM_UPDATE) &&
            <div>
              <p>{message}</p>
              <input type="text" placeholder={this.props.placeholder} onChange={this.handleChange}/>
              <input
                onClick={this.handleSubmit}
                type="submit"
                value={type === ModalBoxTypes.MODALBOX_FORM_CREATE ? 'Create' : 'Update'}/>
            </div>
            }


          </div>}
        </div>
      </div>
    );
  }
}

export default ModalBox;
