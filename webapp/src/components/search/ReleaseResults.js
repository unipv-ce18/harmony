import {Component} from "preact";
import {route} from "preact-router";
import styles from './SearchPage.scss';
import release from "../collection/testRelease";

class ReleaseResults extends Component {
  constructor(props) {
    super(props);
    this.handleClickRelease = this.handleClickRelease.bind(this);
    this.handleClickArtist = this.handleClickArtist.bind(this);
  }

  handleClickRelease(event) {
    route('/release/' + this.props.release.id );
    event.preventDefault();
  }

  handleClickArtist(event) {
    route('/artist/' + this.props.release.artist.id );
    event.preventDefault();
  }

  render(props, state, context) {
    let release = this.props.release;
    return(
      <div class={styles.releaseResult}>
        <img src={release.cover} onClick={this.handleClickSong} class={styles.image}/>
        <span><span class={styles.release}><a href='#' onClick={this.handleClickRelease}>{release.name}</a></span>
          <span class={styles.artistRelease}><a href='#' onClick={this.handleClickArtist}>{release.artist.name}</a></span></span>
      </div>
    );
  }
}

export default ReleaseResults;
