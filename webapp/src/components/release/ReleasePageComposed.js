import {Component} from 'preact';
import {getRelease, setLike} from '../../core/apiCalls';

import styles from './ReleasePage.scss';
import image from './image.jpg';
import {catalog} from '../../Harmony';

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
  initialSongState = (element) => {
      this.initialLikeState(element, 'songs');
    };
  initialReleaseState = (element) => {
      this.initialLikeState(element, 'releases');
    };

  initialLikeState = (element, media_type) => {
    if(element !== null && catalog.inLibrary(media_type, element.firstChild.id)) {
      element.firstChild.classList.add("liked");
      element.firstChild.style = '-webkit-text-fill-color: white;';
    }
  };


  liked(element, media_type) {
    if(element.classList.contains("liked")) {
      element.classList.remove("liked");
      element.style = '-webkit-text-fill-color: transparent;';
      catalog.favorite('DELETE', media_type, element.id)
    } else {
      element.classList.add("liked");
      element.style = '-webkit-text-fill-color: white;';
      catalog.favorite('PUT',media_type, element.id)
    }
  }


  likeSong(element) {
    this.liked(element, 'songs');
  }
  likeRelease(element) {
    this.liked(element, 'releases');
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
            <div>
                <button onClick={e=>{this.likeRelease(e.currentTarget.firstChild)}} ref={this.initialReleaseState}
                       class={styles.likeReleaseButton}>
                <i id={this.props.release.id} className={"fa fa-star "}/>
              </button>
            </div>

          </div>
          <div>
            {this.props.release.songs === null ? '' : this.props.release.songs.map(item =>
              <div>
                <hr/>
                <div>
                  <button onClick={e=>this.likeSong(e.currentTarget.firstChild)} ref={this.initialSongState}><i id={item.id}  class = {"fa fa-star "} /></button>
                  <span>{item.title}</span>
                  <span>{this.composeTime(item.length)}</span>
                </div>
              </div>)}
          </div>
        </div>
      </div>);
  }
}

export default ReleasePageComposed;
