import {session} from '../../Harmony';
import HarmonyPage from '../HarmonyPage';
import {fetchUser} from '../../core/User';
import UserInfo from './UserInfo';

import styles from './UserPage.scss';

class UserPage extends HarmonyPage {

  componentDidMount() {
    this.loadUser();
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id)
      this.loadUser();
  }

  loadUser() {
    fetchUser(session, this.props.id, true)
      .then(user => this.setState({user}))
      .catch(() => session.error = true);
  }

  render({id}, {user}) {
    return (
      <div class={styles.userPage}>
        <div class={styles.userPageContent}>
          {user && <UserInfo user={user} loadUser={()=>this.loadUser()}/>}
        </div>
      </div>);
  }
}

export default UserPage;
