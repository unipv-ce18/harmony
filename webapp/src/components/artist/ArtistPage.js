import {Component} from 'preact';

import {route} from 'preact-router';
import styles from './ArtistPage.scss';
import ArtistInfo from './ArtistInfo';
import ReleaseList from './ReleaseList';
import {session} from '../../Harmony';
import {getArtist, deleteArtist} from '../../core/apiCalls';
import {ModalBoxTypes} from '../modalbox/ModalBox';
import ModalBox from '../modalbox/ModalBox';

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

  handleModalBox(modalbox_type, message) {
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
            <ArtistInfo artist={this.state.artist}/>
            <ReleaseList artist={this.state.artist}/>
            {/*<SimilarArtists />*/}
          </div>
        }
        {modalBox.type &&
        <ModalBox
          type={modalBox.type}
          message={modalBox.message}
          handleCancel={()=>this.handleModalBox('', '')}
          handleSubmit={
            modalBox.type === ModalBoxTypes.MODALBOX_CONFIRM_DELETE ? this.deleteArtistPage.bind(this) : null}
        />}
      </div>);
  }
}

export default ArtistPage;
