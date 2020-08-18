import {session} from '../../Harmony';
import HarmonyPage from '../HarmonyPage';
import {getUserInfo} from '../../core/apiCalls';
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
    session.getAccessToken()
      .then (token => {
        getUserInfo(token, this.props.id, true)
          .then(result => {
            this.setState({user: result});
          })
          .catch( () => session.error = true);
      })
  }

  render({id}) {
    return (
      <div class={styles.userPage}>
        <div class={styles.userPageContent}>
          {this.state.user && <UserInfo user={this.state.user}/>}
        </div>
      </div>);
  }
}

export default UserPage;
