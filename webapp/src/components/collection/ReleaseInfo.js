import {Component} from 'preact';
import {route} from 'preact-router';
import {DEFAULT_ALBUMART_URL} from '../../assets/defaults';

class ReleaseInfo extends Component {

  constructor(props) {
    super(props);
    this.clickArtist = this.clickArtist.bind(this);
  }

  clickArtist(e) {
    e.preventDefault();
    route('/artist/' + this.props.collection.artist.id)
  }

  render() {
    let collection = this.props.collection;
    return (
      <div>
        <div><img src={collection.cover ? collection.cover : DEFAULT_ALBUMART_URL} alt={""}/></div>
        <div>
          <p>{collection.type}</p>
          <p>{collection.name}</p>
          <p><a href='#' onClick={this.clickArtist}>{collection.artist.name}</a></p>
          <p>{collection.date}</p>
        </div>
      </div>
    );
  }
}

export default ReleaseInfo;
