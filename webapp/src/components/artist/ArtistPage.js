import HarmonyPage from '../HarmonyPage';
import {session} from '../../Harmony';
import {getArtist} from '../../core/apiCalls';
import ArtistInfo from './ArtistInfo';
import ReleaseList from './ReleaseList';

import styles from './ArtistPage.scss';

class ArtistPage extends HarmonyPage {
  constructor(props) {
    super(props);

    this.scrollLoop = this.scrollLoop.bind(this);
    this.getArtist = this.getArtist.bind(this);
  }

  componentDidMount() {
    this.getArtist();
  }

  getArtist() {
    session.getAccessToken()
      .then (token => {
        getArtist(this.props.id, true, token)
          .then(result => {
            this.setState({artist: result});
            if(result.image)
              window.addEventListener("scroll", this.scrollLoop);
          })
          .catch( () => session.error = true);
      })
  }

  componentWillUnmount() {
    if(this.state.artist && this.state.artist.image)
      window.removeEventListener("scroll", this.scrollLoop);
  }

  scrollLoop() {
    this.setState({offset: window.scrollY});
  }

  infoArtistUpdated(bool) {
    if (bool) this.getArtist();
  }

  render({id}) {
    return (
      <div class={styles.artistPage}>
        {this.state.artist &&
          <div class={styles.artistPageContent}>
            <img src={this.state.artist.image} alt=''
               style={{transform: `translate(-50%, -50%) translateY(${this.state.offset * 0.5}px)`}}/>
            <ArtistInfo artist={this.state.artist} infoArtistUpdated={this.infoArtistUpdated.bind(this)}/>
            <ReleaseList artist={this.state.artist}/>
            {/*<SimilarArtists />*/}
          </div>}
      </div>);
  }
}

export default ArtistPage;
