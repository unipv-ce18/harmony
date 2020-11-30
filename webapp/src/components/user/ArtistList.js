import {Component} from 'preact';
import {route} from 'preact-router';

import {DEFAULT_ALBUMART_URL, DEFAULT_NEW_CONTENT_IMAGE_URL} from '../../assets/defaults';
import ModalBox, {ModalBoxTypes} from '../modalbox/ModalBox';
import {session} from '../../Harmony';
import {createArtist} from '../../core/apiCalls';
import {artistLink} from '../../core/links';

import styles from './UserPage.scss';

class ArtistList extends Component {
  constructor(props) {
    super(props);

    this.state = {modalBox : {type:'', message:''}};
  }

  handleClickArtist(artist_id, e) {
    e.preventDefault();
    route(artistLink(artist_id));
  }

  createNewArtist(temp_artist_name) {
    let artist_name = temp_artist_name;
    if (!artist_name) artist_name = 'New Artist';
    session.getAccessToken()
      .then(token => {
        createArtist(artist_name, token)
          .then(artistId => route(artistLink(artistId)))
          .catch(() => session.error = true);
      })
  }

  handleModalBox(modalbox_type, message, e) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    const artists = this.props.artists;
    const modalBox = this.state.modalBox;

    return(
      <div className={styles.artists}>
        <div className={styles.artistList}>
          <p>Artists</p>
          {artists && artists.length > 0 && artists.map(artist =>
          <div class={styles.artist}>
            <a href='#' onClick={this.handleClickArtist.bind(this, artist.id)}>
              <img src={artist.image ? artist.image : DEFAULT_ALBUMART_URL} alt={""}/>
            </a>
            <p><a href='#' onClick={this.handleClickArtist.bind(this, artist.id)}>{artist.name}</a></p>
          </div>)}
          {this.props.isUserOwner &&
          <div className={styles.artist}>
              <img src={DEFAULT_NEW_CONTENT_IMAGE_URL} alt={""}
                   onClick={this.handleModalBox.bind(this, ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Artist')} />
            <p onClick={this.handleModalBox.bind(this, ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Artist')}>
              New Artist
            </p>
          </div>}
        </div>
        {modalBox.type &&
        <ModalBox
          type={modalBox.type}
          message={modalBox.message}
          placeholder={modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? 'Artist Name' : ''}
          handleCancel={()=>this.handleModalBox('', '')}
          handleSubmit={
            modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? this.createNewArtist.bind(this) : null}
          />}
      </div>
    );
  }
}

export default ArtistList;
