import {Component} from 'preact';

import styles from './ModalBox.scss';
import {route} from 'preact-router';
import {catalog} from '../../Harmony';

const MODALBOX_ARTIST = 'modalbox_artist';
const MODAL_BOX_ERROR = 'modalbox_error';
const MODAL_BOX_SUCCESS = 'modalbox_success';

class ModalBox extends Component {

  constructor(props) {
    super(props);

    this.state = {
      updated: true,
      newArtistName : ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.addNewArtist = this.addNewArtist.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.type !== prevProps.type)
      this.setState({updated: true});
  }

  handleChange(e) {
    this.setState({newArtistName : e.target.value});
  }

  addNewArtist() {
    let artist_name = this.state.newArtistName;
    if (!artist_name) artist_name = 'New Artist';
    this.props.newArtist(artist_name);
  }

  render() {
    return (
      <div>
        {this.state.updated && this.props.type &&
        <div className={styles.modalBox}>
          {this.props.type === MODAL_BOX_SUCCESS &&
          <div className={styles.modalSuccess}>
            <p>{this.props.message}</p>
          </div>}
          {this.props.type === MODAL_BOX_ERROR &&
          <div className={styles.modalError}>
            <p>{this.props.message}</p>
          </div>}
          {this.props.type !== MODAL_BOX_SUCCESS && this.props.type !== MODAL_BOX_ERROR &&
          <div>
            <button
              onClick={this.props.handleModalBox.bind(this, '', '')}>&times;
            </button>
            {this.props.type === MODALBOX_ARTIST &&
            <div>
              <p>New Artist</p>
              <input type="text" placeholder="Artist Name" onChange={this.handleChange}/>
              <input onClick={this.addNewArtist} type="submit" value="Create"/>
            </div>}
          </div>}
        </div>}
      </div>
    );
  }
}

export default ModalBox;
