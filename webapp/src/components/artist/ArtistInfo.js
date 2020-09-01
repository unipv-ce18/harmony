import {Component} from 'preact';
import {route} from 'preact-router';

import {catalog, session} from '../../Harmony';
import {userLink} from '../../core/links';
import {deleteArtist, patchArtist, uploadContent, uploadToStorage} from '../../core/apiCalls';
import SettingsModal from '../SettingsModal'
import Tags from './Tags';
import Links from './Links';
import IconButton from '../IconButton';
import {
  IconStarEmpty,
  IconStarFull,
  IconSettings,
  IconAdd, IconRemove
} from '../../assets/icons/icons';

import styles from './ArtistPage.scss';

class ArtistInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      additional: false,
      stateUpdated: true,
      inUpdate: false,
      settingsModal: false
    };

    this.handleAdditional = this.handleAdditional.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.addNewMember = this.addNewMember.bind(this);
    this.addNewGenre = this.addNewGenre.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  componentDidMount() {
    this.setAttributesStates();
  }

  setAttributesStates() {
    const artist = this.props.artist;

    this.setState({name : artist.name});

    this.setState({country : artist.country});

    this.setState({genres: artist.genres ? artist.genres : []});
    this.setState({newGenre: ''});

    this.setState({bio: artist.bio});

    this.setState({life_span_begin: artist.life_span && artist.life_span.begin ? artist.life_span.begin : '2020'});
    this.setState({life_span_end: artist.life_span && artist.life_span.end ? artist.life_span.end : ''});

    this.setState({members: artist.members ? artist.members : []});
    this.setState({newMemberName: ''});
    this.setState({newMemberRole: ''});

    this.setState({website: artist.links && artist.links.website ? artist.links.website : ''});
    this.setState({facebook: artist.links && artist.links.facebook ? artist.links.facebook : ''});
    this.setState({twitter: artist.links && artist.links.twitter ? artist.links.twitter : ''});
    this.setState({instagram: artist.links && artist.links.instagram ? artist.links.instagram : ''});
  }


  handleAdditional() {
    this.setState( prevState => ({ additional: !prevState.additional}));
  }

  initialArtistLikeState () {
    return catalog.inLibrary('artists', this.props.artist.id);
  };

  likeArtist(function_type) {
      catalog.favorite(function_type, 'artists', this.props.artist.id)
      this.setState({stateUpdated: true});
  }

  isUserOwner() {
    return session.currentUser?.id === this.props.artist.creator;
  }

  deleteArtistPage() {
    session.getAccessToken()
      .then (token => {
        deleteArtist(this.props.artist.id, token)
          .then(() => {
            route(userLink(session.currentUser?.id));
          })
          .catch( () => session.error = true);
      })
  }

  handleSettingsModal(isOpen) {
    this.setState({settingsModal: isOpen});
  }

  modifyPage(bool) {
    this.setState({inUpdate: bool});
    if(!bool) this.setAttributesStates();
  }

  handleChange({target}) {
    this.setState({[target.name]: target.value});
  }

  uploadArtistImage(file) {
    session.getAccessToken()
      .then (token => {
        uploadContent('artist', this.props.artist.id, file.type, file.size, token)
          .then(presignedData => {
            uploadToStorage(presignedData, file);
            this.setState({settingsModal : false});
          })
          .catch( () => session.error = true);
      })
  }

  removeMember(index) {
    let members = [...this.state.members];
    members.splice(index, 1);
    this.setState({members});
  }

  addNewMember() {
    if(this.state.newMemberName !== '' && this.state.newMemberRole !== '') {
      let members = [...this.state.members];
      members.push({name: this.state.newMemberName, role: this.state.newMemberRole});
      this.setState({members});
      this.setState({newMemberName: ''});
      this.setState({newMemberRole: ''});
    }
  }

  removeGenre(index) {
    let genres = [...this.state.genres];
    genres.splice(index, 1);
    this.setState({genres});
  }

  addNewGenre() {
    if(this.state.newGenre !== '') {
      let genres = [...this.state.genres];
      genres.push(this.state.newGenre.replace(/\w\S*/g,
        (txt)=>{return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()}));
      this.setState({newGenre: ''});
      this.setState({genres});
    }
  }

  handleUpdate() {
    const artist = this.props.artist;
    let name=false, country=false, life_span=false, temp_life_span_end=null,
      genres=false, bio=false, members=false, links;

    if (this.state.name !== artist.name && this.state.name !== '') name = true;
    if (this.state.country !== artist.country) country = true;
    if (this.state.life_span_end !== '') temp_life_span_end = this.state.life_span_end;
    if (!artist.life_span || artist.life_span &&
      ((this.state.life_span_begin !== artist.life_span.begin) || (temp_life_span_end !== artist.life_span.end) &&
      (temp_life_span_end === null || temp_life_span_end >= this.state.life_span_begin)))
        life_span = true;
    if (this.state.genres !== artist.genres) genres = true;
    if (this.state.bio !== artist.bio) bio = true;
    if (this.state.members !== artist.members) members = true;

    links = {
      ...(this.state.facebook !== '') && {facebook: this.state.facebook},
      ...(this.state.instagram !== '') && {instagram: this.state.instagram},
      ...(this.state.twitter !== '') && {twitter: this.state.twitter},
      ...(this.state.website !== '') && {website: this.state.website}
    };

      let patch = {
        ...(name) && {name: this.state.name},
        ...(country) && {country: this.state.country !== '' ? this.state.country : null},
        ...(life_span) && {life_span: {
            begin: this.state.life_span_begin,
            end: temp_life_span_end !== null ? temp_life_span_end : null
          }},
        ...(genres) && {genres: this.state.genres.length !== 0 ? this.state.genres : null},
        ...(bio) && {bio: this.state.bio !== '' ? this.state.bio : null},
        ...(members) && {members: this.state.members.length !== 0 ? this.state.members : null},
        ...(JSON.stringify(artist.links) !== JSON.stringify(links)) && {links}};

    if (Object.keys(patch).length !== 0) {
      session.getAccessToken()
        .then (token => {
          patchArtist(token, artist.id, patch)
            .then( () => {
              this.props.infoArtistUpdated(true);
            })
            .catch( () => session.error = true);
        })
    }
    this.props.infoArtistUpdated(false);
    this.setState({inUpdate: false});
  }

  render() {
    const artist = this.props.artist;
    let life_span_begin = [];
    for (let i = 1800; i <= 2020; i++) {
        life_span_begin.push(<option value={i}>{i}</option>);
    }
    let life_span_end = [];
    life_span_end.push(<option value={null}>Still Active</option>)
    for (let i = 1800; i <= 2020; i++) {
        life_span_end.push(<option value={i}>{i}</option>);
    }

    return(
      <div class={styles.artistInfo}>
        {!this.state.inUpdate ?
          <div>
            <div className={styles.name}>
              <h2>{artist.name}</h2>
              {this.state.stateUpdated && this.initialArtistLikeState()
                ? <IconButton size={24} name="Dislike" icon={IconStarFull}
                              onClick={this.likeArtist.bind(this, 'DELETE')}/>
                : <IconButton size={24} name="Like" icon={IconStarEmpty}
                              onClick={this.likeArtist.bind(this, 'PUT')}/>}
              {this.isUserOwner() &&
              <IconButton size={24} name="Settings" icon={IconSettings}
                          onClick={this.handleSettingsModal.bind(this, true)}/>}
            </div>
            <span class={styles.listeners}>Listeners: {artist.counter}</span>
            {artist.genres && artist.genres.length > 0 &&
            <div>
              <Tags list = {artist.genres}/>
            </div>}
            {artist.bio &&
            (artist.bio.split(' ').length > 50 && !this.state.additional
              ? <div className={styles.artistBio}>{artist.bio.split(' ').slice(0, 50).join(' ') + '...'}</div>
              : <div className={styles.artistBio}>{artist.bio}</div>)}
            {this.state.additional &&
            <div className={styles.additionalInfo}>
              {artist.life_span &&
              <div>
                {artist.life_span.begin} - {artist.life_span.end === null ? "Still Active" : artist.life_span.end}
              </div>}
              {artist.members && artist.members.length > 0 &&
              <ul>
                {artist.members.map(item => item && <li className={styles.member}>{item.name} - {item.role}</li>)}
              </ul>}
                {artist.links && Object.keys(artist.links).length > 0 ? <Links links = {artist.links}/> : null}
            </div>}
            <span>
              <button onClick={this.handleAdditional}>{this.state.additional ? 'Read less' : 'Read more'} </button>
            </span>
          </div>
          :
          <div class={styles.artistUpdatingInfo}>
            <div>
              <p>Artist Name</p>
              <input
                type="text"
                name="name"
                value={this.state.name}
                placeholder={this.state.name ? this.state.name : 'Artist Name'}
                onChange={this.handleChange}/>
            </div>
            <div>
              <p>Genres</p>
              {this.state.genres && this.state.genres.length > 0 &&
                this.state.genres.map((item, index) => item &&
                <div>
                  <IconButton size={22} name={"Remove Genre"} icon={IconRemove}
                    onClick={()=>this.removeGenre(index)}/>
                  {item}
                </div>)}
            </div>
            <div>
              <input type="text" name="newGenre" value={this.state.newGenre} placeholder={'New Genre'}
                onChange={this.handleChange}/>
              <IconButton size={26} name={"Add Genre"} icon={IconAdd}
                onClick={this.addNewGenre}/>
            </div>
            <div>
              <p>Biography</p>
              <input type="text" name="bio" value={this.state.bio}
                     placeholder={this.state.bio ? this.state.bio : 'Biography'}
                     onChange={this.handleChange}/>
            </div>
            <div>
              <p>Life Span</p>
              <select name='life_span_begin' value={this.state.life_span_begin}
                    onChange={this.handleChange}>
              {life_span_begin}
              </select>
              <select name='life_span_end' value={this.state.life_span_end}
                      onChange={this.handleChange}>
                {life_span_end}
              </select>
            </div>
            <div>
              <p>Members</p>
              {this.state.members && this.state.members.length > 0  &&
                this.state.members.map((item, index) => item &&
                  <div>
                    <IconButton size={22} name={"Remove Member"} icon={IconRemove}
                      onClick={()=>this.removeMember(index)}/>
                    {item.name} - {item.role}
                  </div>)}
              <div>
                <input type="text" name="newMemberName" value={this.state.newMemberName} placeholder={'New Member Name'}
                  onChange={this.handleChange}/>
                <input type="text" name="newMemberRole" value={this.state.newMemberRole} placeholder={'New Member Roles'}
                  onChange={this.handleChange}/>
                <IconButton size={26} name={"Add Member"} icon={IconAdd}
                  onClick={this.addNewMember}/>
              </div>
            </div>
            <div>
              <p>Links</p>
              <div>
                <input type="text" name="website" value={this.state.website} placeholder={'Web site'}
                  onChange={this.handleChange}/>
              </div>
              <div>
                <input type="text" name="facebook" value={this.state.facebook} placeholder={'Facebook'}
                onChange={this.handleChange}/>
              </div>
              <div>
                <input type="text" name="twitter" value={this.state.twitter} placeholder={'Twitter'}
                onChange={this.handleChange}/>
              </div>
              <div>
                <input type="text" name="instagram" value={this.state.instagram} placeholder={'Instagram'}
                onChange={this.handleChange}/>
              </div>
            </div>
            <button onClick={this.modifyPage.bind(this, false)}>Cancel</button>
            <button onClick={() => this.handleUpdate()}>Update</button>
          </div>}
        {this.state.settingsModal &&
        <SettingsModal
          handleSettingsModal={this.handleSettingsModal.bind(this)}
          type="artist"
          uploadImage={this.uploadArtistImage.bind(this)}
          modifyPage={this.modifyPage.bind(this)}
          removeArtist={this.deleteArtistPage.bind(this)}/>}
      </div>
    );
  }
}

export default ArtistInfo;
