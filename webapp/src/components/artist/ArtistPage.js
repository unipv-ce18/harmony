import HarmonyPage from '../HarmonyPage';
import {session} from '../../Harmony';
import {getArtist} from '../../core/apiCalls';
import ArtistInfo from './ArtistInfo';
import ReleaseList from './ReleaseList';

import styles from './ArtistPage.scss';

class ArtistPage extends HarmonyPage {
  constructor(props) {
    super(props);

    this.state = {update : false};
    this.updatePage = this.updatePage.bind(this);
    this.scrollLoop = this.scrollLoop.bind(this);
  }

  componentDidMount() {
    session.getAccessToken()
      .then (token => {
        getArtist(this.props.id, true, token)
          .then(result => {
            this.setState({artist: result});
          })
          .catch( () => session.error = true);
      })

    window.addEventListener("scroll", this.scrollLoop);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.scrollLoop);
  }

  scrollLoop() {
    this.setState({offset: window.scrollY});
  }

  updatePage() {
    this.setState({update : true});
  }

  render({id}) {
    return (
      <div class={styles.artistPage}>
        {this.state.artist &&
          <div class={styles.artistPageContent}>
            <img src={this.state.artist.image} alt=''
               style={{transform: `translate(-50%, -50%) translateY(${this.state.offset * 0.5}px)`}}/>
            <ArtistInfo artist={this.state.artist}/>
            <ReleaseList artist={this.state.artist}/>
            {/*<SimilarArtists />*/}
          </div>}
      </div>);
  }
}

export default ArtistPage;
