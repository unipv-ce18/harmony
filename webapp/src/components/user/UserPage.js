import {Component} from 'preact';

import styles from './UserPage.scss';
import UserInfo from './UserInfo';
import {session} from '../../Harmony';
import {getUserInfo} from '../../core/apiCalls';


class UserPage extends Component {


  componentDidMount() {
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
        {this.state.user &&
          <div class={styles.userPageContent}>
            <UserInfo user={this.state.user}/>
          </div>
        }
      </div>);
  }
}

export default UserPage;
