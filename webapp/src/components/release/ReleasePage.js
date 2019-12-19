import {Component} from 'preact';

import release from './testRelease';
import styles from './ReleasePage.scss';
import {getRelease} from "../../core/apiCalls";
import {session} from "../../Harmony";

class ReleasePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      release: {},
      artist: {},
      songList: []
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
    let songList = [];
    for (let [key, value] of Object.entries(release)) {
      if (key === 'songs') {
        value.forEach(function (song) {
          let songObj = {};
          for (let [key2, value2] of Object.entries(song)) {
            songObj[key2] = value2;
          }
          songList.push(songObj);
        });
      }
    }
    this.setState({songList: songList});

    getRelease(/[^/]*$/.exec(window.location.href)[0]).then(result => {
      this.setState({release: result});

      let artistObj = {};
      for (let [key, value] of Object.entries(result))
        if (key === 'artist')
          for (let [key2, value2] of Object.entries(value))
            if (key2 === 'name') {
              artistObj[key2] = value2;
              this.setState({artist: artistObj});
            }
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
              <p>{this.state.artist.name}</p>
              <p>{this.state.release.date}</p>
            </div>

          </div>
          <div>
            {this.state.songList.map(item =>
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
