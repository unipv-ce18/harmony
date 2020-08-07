import {Component} from 'preact';

import {route} from 'preact-router';
import styles from './ArtistPage.scss';
import ArtistInfo from './ArtistInfo';
import ReleaseList from './ReleaseList';
import {session} from '../../Harmony';
import {getArtist} from '../../core/apiCalls';

import {getArtist, deleteArtist, createRelease} from '../../core/apiCalls';
import image from '../user/plus.jpg';

class ArtistPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      update : false,
      modalBox : {type:'', message:''}
    };
    this.updatePage = this.updatePage.bind(this);
    this.scrollLoop = this.scrollLoop.bind(this);
    this.deleteArtistPage = this.deleteArtistPage.bind(this);
    this.createReleasePage = this.createReleasePage.bind(this);
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

  isUserOwner() {
    return session.getOwnData().id === this.state.artist.creator;
  }

  updatePage() {
    this.setState({update : true});
  }

  deleteArtistPage() {
    session.getAccessToken()
      .then (token => {
        deleteArtist(this.props.id, token)
          .then(() => {
            route('/user/' + session.getOwnData().id);
          })
          .catch( () => session.error = true);
      })
  }

  createReleasePage(temp_release_name) {
    let release_name = temp_release_name;
    if (!release_name) release_name = 'New Release';
    session.getAccessToken()
      .then (token => {
        createRelease(this.props.id, release_name, token)
          .then(result => {
            route('/release/' + result['release_id']);
          })
          .catch( () => session.error = true);
      })
  }

  handleModalBox(modalbox_type, message, e) {
    e.preventDefault();
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render({id}) {
    let modalBox = this.state.modalBox;

    return (
      <div class={styles.artistPage}>
        {this.state.artist &&
          <div class={styles.artistPageContent}>
            <img src={this.state.artist.image} alt=''
               style={{transform: `translate(-50%, -50%) translateY(${this.state.offset * 0.5}px)`}}/>
            {this.isUserOwner() &&
              <button onClick={this.updatePage}>Modify your artist page</button>}
            <ArtistInfo artist={this.state.artist}/>
            {this.state.artist.releases ? <ReleaseList list={this.state.artist.releases}/> : null}
            {this.isUserOwner() &&
              <div class={styles.releaseList}>
                <div class={styles.release}>
                  <a href='#' onClick={this.handleModalBox.bind(this,
                    ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Release')}>
                    <img src={image} alt={""}/>
                  </a>
                  <p><a href='#' onClick={this.handleModalBox.bind(this,
                    ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Release')}>
                    New Release</a></p>
                </div>
              </div>}
            {/*<SimilarArtists />*/}
            {this.isUserOwner() &&
              <button onClick={this.handleModalBox.bind(this, MODALBOX_ARTIST_DELETE, '')}>Delete your artist page</button>}
          </div>
        }
        <ModalBox
          handleModalBox={this.handleModalBox.bind(this)}
          removeArtist={this.deleteArtistPage.bind(this)}
          newRelease={this.createReleasePage.bind(this)}
          type={this.state.modalBox.type}
          message={this.state.modalBox.message}/>
      </div>);
  }
}

export default ArtistPage;
