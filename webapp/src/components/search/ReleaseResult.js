import {Component} from "preact";

import {artistLink, releaseLink} from '../../core/links';

import styles from './SearchPage.scss';

class ReleaseResult extends Component {
  render({content: release}) {
    return(
      <div class={styles.releaseResult}>
        <img src={release.cover} alt="" class={styles.image}/>
        <span>
          <span class={styles.release}>
            <a href={releaseLink(release.id)}>{release.name}</a>
          </span>
          <span class={styles.artistRelease}>
            <a href={artistLink(release.artist.id)}>{release.artist.name}</a>
          </span>
        </span>
      </div>
    );
  }
}

export default ReleaseResult;
