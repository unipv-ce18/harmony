import {Component} from 'preact';

import styles from './ReleasePage.scss';
import image from './image.jpg';

class ReleasePageComposed extends Component {
  constructor(props) {
    super(props);
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

  render() {
    return (
      <div class={styles.releasePage}>
        <div class={styles.releasePageContent}>
          <div>
            {/*<img src={this.props.release.cover} alt={""}/>*/}
            <img src={image} alt={""}/>
            <div>
              <p>{this.props.release.type}</p>
              <p>{this.props.release.name}</p>
              <p>{this.props.release.artist.name}</p>
              <p>{this.props.release.date}</p>
            </div>

          </div>
          <div>
            {this.props.release.songs === null ? '' : this.props.release.songs.map(item =>
              <div>
                <hr/>
                <div><span>{item.title}</span><span/><span>{this.composeTime(item.length)}</span></div>
              </div>)}
          </div>
        </div>
      </div>);
  }
}

export default ReleasePageComposed;
