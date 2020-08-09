import {Component} from 'preact';
import {route} from 'preact-router';
import {DEFAULT_ALBUMART_URL} from '../../assets/defaults';
import styles from './CollectionInfo.scss';
import IconButton from '../IconButton';
import {IconExpand} from '../../assets/icons/icons';

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
    let type=null, name=null, date=null;
    if ((this.state.type !== this.props.type) && this.state.type !== '') type = this.state.type;
    if ((this.state.name !== this.props.name) && this.state.name !== '') name = this.state.name;
    if ((this.state.date !== this.props.date) && this.state.date !== '') {
      date = this.state.date;
      if (this.state.checkBox) {
        const d = new Date(this.state.date);
        if ( !!d.valueOf() ) date = d.getFullYear();
      }
    }
    this.props.updateReleaseInfo(type, name, date);
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
