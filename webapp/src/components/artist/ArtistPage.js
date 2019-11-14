import {Component} from 'preact';

import styles from './ArtistPage.scss';

class ArtistPage extends Component {
  render() {
    return (
      <div class={styles.artistPage}>
        <div class={styles.artistPageContent}>
        </div>
      </div>);
  }
}

export default ArtistPage;
