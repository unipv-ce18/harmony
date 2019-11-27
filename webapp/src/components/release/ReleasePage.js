import {Component} from 'preact';

import release from './testRelease';
import styles from './ReleasePage.scss';

class ReleasePage extends Component {

  composeTime(time) {
    let date = new Date(time);
    let seconds = ('0'+date.getUTCSeconds()).slice(-2);
    let minutes = date.getUTCMinutes();
    let hours = date.getUTCHours();
    if (hours > 0)
      return hours+":"+minutes+":"+seconds;
    return minutes+":"+seconds;
  }

  render() {

    let albumData = {};
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
      } else albumData[key] = value;
    }

    return (
      <div class={styles.releasePage}>
        <div class={styles.releasePageContent}>
          <div>
            <img src={require('../release/' + albumData.cover)} alt={""}/>
            <div>
              <p>{albumData.type}</p>
              <p>{albumData.name}</p>
              <p>{albumData.artist}</p>
              <p>{albumData.date}</p>
            </div>

          </div>
          <div>
            {songList.map(item =>
              <div><hr/><div><span>{item.title}</span><span/><span>{this.composeTime(item.length)}</span></div></div>)}
          </div>
        </div>
      </div>);
  }
}

export default ReleasePage;
