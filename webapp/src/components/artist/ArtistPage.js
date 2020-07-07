import {Component} from 'preact';

import styles from './ArtistPage.scss';
import ArtistInfo from "./ArtistInfo";
import ReleaseList from "./ReleaseList";
import {session} from '../../Harmony';
import {getArtist} from '../../core/apiCalls';


class ArtistPage extends Component {


  componentDidMount() {
    session.getAccessToken()
      .then (token => {
        getArtist(this.props.id, true, token)
          .then(result => {
            this.setState({artist: result});
          })
          .catch( () => session.error = true);
      })
  }

  render({id}) {
    return (
      <div class={styles.artistPage}>
        {this.state.artist &&
          <div class={styles.artistPageContent}>
            <ArtistInfo artist={this.state.artist}/>
            {/*<Songs list = {songTest}/>*/}
            <ReleaseList list={this.state.artist.releases}/>
            {/*<SimilarArtists />*/}
          </div>
        }
      </div>);
  }
}

export default ArtistPage;
