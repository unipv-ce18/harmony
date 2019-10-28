import {Component} from 'preact';
import styles from './App.css';
import Logo from "./login/Logo";
import Login from "./login/Login";

class App extends Component {
  render() {
    return (
      <div class={styles.App}>
        <Logo/>,
        <Login/>
      </div>
    );
  }
}

export default App;

