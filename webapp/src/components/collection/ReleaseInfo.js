import {Component} from 'preact';
import {route} from 'preact-router';
import {DEFAULT_ALBUMART_URL} from '../../assets/defaults';
import SettingsModal from '../SettingsModal'
import styles from './CollectionInfo.scss';
import {catalog, session} from '../../Harmony';
import {deleteRelease, patchRelease, uploadContent, uploadToStorage} from '../../core/apiCalls';
import IconButton from '../IconButton';
import {IconEdit, IconQueue, IconSettings, IconStarEmpty, IconStarFull} from '../../assets/icons/icons';
import CollectionSettingsModal from './CollectionSettingsModal';

class ReleaseInfo extends Component {

  constructor(props) {
    super(props);

    this.state = {
      inUpdate: false,
      checkBox: false,
      settingsModal: false,
      settingsType: ''
    }
    this.clickArtist = this.clickArtist.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClickCheckbox = this.handleClickCheckbox.bind(this);
    this.handleClickUpdate = this.handleClickUpdate.bind(this);

  }

  componentDidMount() {
    this.setAttributesStates();
  }

  setAttributesStates(){
    this.setState({type : this.props.collection.type});
    this.setState({name : this.props.collection.name});
    this.setState({date : this.props.collection.date});
  }

  userOwnRelease() {
    return session.currentUser?.id === this.props.collection.artist.creator;
  }

  initialCollectionLikeState () {
    return catalog.inLibrary('releases', this.props.collection.id);
  };

  likeCollection(function_type) {
    catalog.favorite(function_type, 'releases', this.props.collection.id)
    this.setState({stateUpdated: true});
  }

  modifyPage(bool) {
    this.setState({inUpdate : bool});
    if(!bool) this.setAttributesStates();
  }

  handleSettingsModal(isOpen, type) {
    this.setState({settingsModal: isOpen});
    this.setState({settingsType: type});
  }

  uploadReleaseCover(file) {
    session.getAccessToken()
      .then (token => {
        uploadContent('release', this.props.collection.id, file.type, file.size, token)
          .then(presignedData => {
            uploadToStorage(presignedData, file);
            this.setState({settingsModal : false});
          })
          .catch( () => session.error = true);
      })
  }

  clickArtist(e) {
    e.preventDefault();
    route('/artist/' + this.props.collection.artist.id)
  }

  handleChange({target}) {
    this.setState({[target.name]: target.value});
  }

  handleClickCheckbox() {
    this.setState(prevState => ({checkBox : !prevState.checkBox}));
  }

  handleClickUpdate() {
    const coll = this.props.collection;
    let name=false, type=false, date=false, d=this.state.date;
    if ((this.state.name !== coll.name) && this.state.name !== '') name = true;
    if ((this.state.type !== coll.type) && this.state.type !== '') type = true;
    if (this.state.checkBox) {
      d = new Date(d).getFullYear().toString();
    }
    if(d && (!coll.date || (coll.date.length !== d.length ||
        (coll.date.length === d.length && coll.date !== d)))) date = true;


    let patch = {
        ...(name) && {name: this.state.name},
        ...(type) && {type: this.state.type},
        ...(date) && {date: d}};

    if (Object.keys(patch).length !== 0) {
      session.getAccessToken()
        .then (token => {
          patchRelease(token, this.props.collection.id, patch)
            .then( () => {
              this.props.infoCollectionUpdated();
            })
            .catch( () => session.error = true);
        })
    }
    this.setState({inUpdate: false});
  }

  deleteReleasePage() {
    session.getAccessToken()
      .then (token => {
        deleteRelease(this.props.collection.id, token)
          .then(result => {route('/artist/' + this.props.collection.artist.id)})
          .catch( () => session.error = true);
      })
  }


  render() {
    let collection = this.props.collection;
    return (
      [<div class={styles.release}>
        {this.userOwnRelease()
         ? <div>
            <img src={collection.cover ? collection.cover : DEFAULT_ALBUMART_URL} alt={""}/>
            <label htmlFor="upload">
              <input type="file" id="upload" style="display:none"
                onChange={e => this.uploadReleaseCover(e.target.files[0])}/>
              <IconButton size={24} name="Settings" icon={IconEdit}/>
            </label>
           </div>
         : <div><img src={collection.cover ? collection.cover : DEFAULT_ALBUMART_URL} alt={""}/></div>}
        {!this.state.inUpdate ?
        <div  class={styles.releaseInfo}>
          <p>{collection.type}</p>
          <p>{collection.name}</p>
          <p><a href='#' onClick={this.clickArtist}>{collection.artist.name}</a></p>
          <p>{collection.date}</p>
        </div>
        :
        <div class={styles.releaseUpdatingInfo}>
          <p>Select type:</p>
          <select name="type" value={this.state.type} onChange={this.handleChange}>
            <option value='album'>album</option>
            <option value='single'>single</option>
            <option value='ep'>ep</option>
            <option value='compilation'>compilation</option>
            <option value='live'>live</option>
            <option value='remix'>remix</option>
          </select>
          <p>Release name:</p>
          <input
            type="text"
            name="name"
            value={this.state.name}
            placeholder={this.state.name ? this.state.name : 'Release Name'}
            onChange={this.handleChange}/>
            <p>Select date:</p>
          <input type="date" name="date" value={this.state.date} onChange={this.handleChange}/>
          <div>
            <input type="checkbox" name="checkBox" value="checked" checked={this.state.checkBox}
                   onClick={this.handleClickCheckbox}/>
            <label htmlFor="checkBox">Show only year</label>
          </div>
        </div>}
      </div>,
      <div>
        {this.state.inUpdate ?
        <div>
          <button onClick={()=>this.modifyPage(false)}>Cancel</button>
          <button onClick={this.handleClickUpdate}>Update</button>
        </div>
        :
        <div>
        {this.userOwnRelease() &&
          <IconButton size={24} name="Settings" icon={IconSettings}
              onClick={this.handleSettingsModal.bind(this, true)}/>}
        {this.initialCollectionLikeState()
          ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                        onClick={this.likeCollection.bind(this, 'DELETE')}/>
          : <IconButton size={24} name="Like" icon={IconStarEmpty}
                        onClick={this.likeCollection.bind(this, 'PUT')}/>}
          <IconButton
            size={22}
            name={"Add To Queue"}
            icon={IconQueue}
            onClick={()=>this.props.addSongsToQueue()}/>
        </div>}
      </div>,
      this.state.settingsModal &&
        <CollectionSettingsModal
          handleSettingsModal={this.handleSettingsModal.bind(this)}
          type='release'
          modifyPage={this.modifyPage.bind(this)}
          removeCollection={this.deleteReleasePage.bind(this)}
          uploadImage={this.uploadReleaseCover.bind(this)}/>]
    );
  }
}

export default ReleaseInfo;
