import {Component} from 'preact';

import release from './testRelease';
import styles from './ReleasePage.scss';
import {getRelease} from "../../core/apiCalls";
import {session} from "../../Harmony";
import {route} from "preact-router";

class ReleasePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      release: {
        artist: {id: '', name: ''},
        songs: []
      }
    };

  }

  composeTime(time) {
    let date = new Date(time);
    let seconds = ('0' + date.getUTCSeconds()).slice(-2);
    let minutes = date.getUTCMinutes();
    let hours = date.getUTCHours();
    if (hours > 0)
      return hours + ":" + minutes + ":" + seconds;
    return minutes + ":" + seconds;
  }


  componentDidMount() {
    getRelease(/[^/]*$/.exec(window.location.href)[0], true)
      .then(result => {
        this.setState({release: result});
      })
      .catch( e => {
        route('/');
      });
  }

  render() {

    return (
      <div class={styles.releasePage}>
        <div class={styles.releasePageContent}>
          <div>
            <img src={this.state.release.cover} alt={""}/>
            <div>
              <p>{this.state.release.type}</p>
              <p>{this.state.release.name}</p>
              <p>{this.state.release.artist.name}</p>
              <p>{this.state.release.date}</p>
            </div>

          </div>
          <div>
            {this.state.release.songs === null ? '' : this.state.release.songs.map(item =>
              <div>
                <hr/>
                <div><span>{item.title}</span><span/><span>{this.composeTime(item.length)}</span></div>
              </div>)}
          </div>
        </div>
      </div>);
  }
}

export default ReleasePage;
