import {Component} from 'preact';
import styles from './ArtistPage.scss';
import {route} from 'preact-router';
import {IconExpand} from '../../assets/icons/icons';
import IconButton from '../IconButton';
import {DEFAULT_ALBUMART_URL, DEFAULT_NEW_CONTENT_IMAGE_URL} from '../../assets/defaults';
import ModalBox, {ModalBoxTypes} from '../modalbox/ModalBox'
import {createRelease} from '../../core/apiCalls';

const MODALBOX_RELEASE = 'modalbox_release';

class ReleaseList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      order: 'date',
      modalBox : {type:'', message:''}
    };

    this.handleChangeOrder = this.handleChangeOrder.bind(this);
    this.createReleasePage = this.createReleasePage.bind(this);
  }

  handleClickRelease(release_id, event) {
    event.preventDefault();
    route('/release/' + release_id);
  }

  handleChangeOrder(event) {
    this.setState({
      order: event.target.value
    });
  }

  isUserOwner() {
    return session.getOwnData().id === this.props.artist.creator;
  }

  createReleasePage(temp_release_name) {
    let release_name = temp_release_name;
    if (!release_name) release_name = 'New Release';
    session.getAccessToken()
      .then (token => {
        createRelease(this.props.artist.id, release_name, token)
          .then(result => {
            route('/release/' + result['release_id']);
          })
          .catch( () => session.error = true);
      })
  }

  handleModalBox(modalbox_type, message) {
    this.setState({modalBox: {type: modalbox_type, message: message}});
  }

  render() {
    const order = this.state.order;
    let modalBox = this.state.modalBox;
    let list = this.props.artist.releases ? this.props.artist.releases : [];

    list.sort(function (a, b) {
      switch (order) {
        case 'date':
          return a.date < b.date;
        case 'az':
          return a.name > b.name;
        case 'za':
          return a.name < b.name;
        case 'type':
          return a.type > b.type;
      }});

    return(
      <div class={styles.releaseList}>
        <div>
          <span className={styles.sectionTitle}>Releases</span>
          <span className={styles.sort}>
            Sort by:
            <select value={this.state.order} onChange={this.handleChangeOrder}>
              <option value='az'>AZ</option>
              <option value='za'>ZA</option>
              <option value='type'>TYPE</option>
              <option value='date' selected>DATE</option>
            </select>
            <IconButton size={24} name="Sort Releases By" icon={IconExpand}/>
          </span>
        </div>
        <div class = {styles.releasesList}>
          {list.map(release =>
            <div class = {styles.release}>
              <a href='#' onClick={this.handleClickRelease.bind(this, release.id)}>
                <img src={release.cover ? release.cover : DEFAULT_ALBUMART_URL} alt={release.name}/>
              </a>
              <p><a href='#' onClick={this.handleClickRelease.bind(this, release.id)}>{release.name}</a></p>
            </div>)}
          {this.isUserOwner() &&
            <div class = {styles.release}>
                <a href='#' onClick={this.handleModalBox.bind(this,
                  ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Release')}>
                  <img src={DEFAULT_NEW_CONTENT_IMAGE_URL} alt={""}/>
                </a>
                <p><a href='#' onClick={this.handleModalBox.bind(this,
                  ModalBoxTypes.MODALBOX_FORM_CREATE, 'New Release')}>New Release</a></p>
            </div>}
        </div>
        {modalBox.type &&
        <ModalBox
          type={modalBox.type}
          message={modalBox.message}
          placeholder={modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? 'Release Name' : ''}
          handleCancel={()=>this.handleModalBox('', '')}
          handleSubmit={
            modalBox.type === ModalBoxTypes.MODALBOX_FORM_CREATE ? this.createReleasePage.bind(this) : null}
          />}
      </div>
    );
  }
}

export default ReleaseList;
