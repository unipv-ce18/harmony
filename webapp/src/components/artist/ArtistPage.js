import {Component} from 'preact';

import styles from './ArtistPage.scss';
import test from './test.js';
import ArtistInfo from "./ArtistInfo";
import AlbumsList from "./AlbumsList";

class ArtistPage extends Component {
  render({id}) {
    // function to retrieve data from db - fetching id
    let result = test;
    let info = JSON.parse(JSON.stringify(result));
    delete info.releases;
    return (
      <div class={styles.artistPage}>
        <div class={styles.artistPageContent}>
          <ArtistInfo info = {info}/>
          {/*<Songs list = {songTest}/>*/}
          <AlbumsList list = {result.releases} />
          {/*<SimilarArtists />*/}
        </div>
      </div>);
  }
}

export default ArtistPage;
