import {Component} from 'preact';
import {route} from 'preact-router';
import {DEFAULT_ALBUMART_URL} from '../../assets/defaults';
import styles from './CollectionInfo.scss';
import {session} from '../../Harmony';
import {patchRelease} from '../../core/apiCalls';

class ReleaseInfo extends Component {

  constructor(props) {
    super(props);

    this.state = {
      type : "",
      name : "",
      date : "",
      checkBox : false
    }
    this.clickArtist = this.clickArtist.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClickCheckbox = this.handleClickCheckbox.bind(this);
  }

  componentDidMount() {
    this.setState({type : this.props.collection.type});
    this.setState({name : this.props.collection.name});
    this.setState({date : this.props.collection.date});
  }

  componentDidUpdate(prevProps) {
    if(this.props.pageUpdated && !prevProps.pageUpdated) {
      this.handleUpdate();
    }
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

  handleUpdate() {
    const coll = this.props.collection;
    let name=false, type=false, date=false, d=this.state.date;
    if ((this.state.name !== coll.name) && this.state.name !== '') name = true;
    if ((this.state.type !== coll.type) && this.state.type !== '') type = true;
    if (this.state.checkBox) {
      d = new Date(d).getFullYear().toString();
    }
    if(d !== '' && (coll.date.length !== d.length ||
        (coll.date.length === d.length && coll.date !== d))) date = true;


    let patch = {
        ...(name) && {name: this.state.name},
        ...(type) && {type: this.state.type},
        ...(date) && {date: d}};

    if (Object.keys(patch).length !== 0) {
      session.getAccessToken()
        .then (token => {
          patchRelease(token, this.props.collection.id, patch)
            .then( () => {
              this.props.infoCollectionUpdated(true);
            })
            .catch( () => session.error = true);
        })
    }
    this.props.infoCollectionUpdated(false);
  }

  render() {
    let collection = this.props.collection;
    return (
      <div class={styles.release}>
        <div><img src={collection.cover ? collection.cover : DEFAULT_ALBUMART_URL} alt={""}/></div>
        {!this.props.inUpdate ?
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
          <p>Change name:</p>
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
      </div>
    );
  }
}

export default ReleaseInfo;
