import {Component} from 'preact';

import styles from './UserPage.scss';
import {session} from '../../Harmony';
import {patchUser, deleteUser, uploadContent, uploadToStorage} from '../../core/apiCalls';
import SettingsModal from '../SettingsModal'
import IconButton from '../IconButton';
import {IconSettings} from '../../assets/icons/icons';
import {DEFAULT_USER_IMAGE_URL} from '../../assets/defaults';

class UserHeader extends Component {
  constructor(props) {
    super(props);


  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
  }


  render() {
    const user = this.props.user;

  }
}

export default UserHeader;
