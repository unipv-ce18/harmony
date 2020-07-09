import {Component} from 'preact';
import {route} from 'preact-router';

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
    return (
      <div>
        <div><img src={this.props.collection.cover} alt={""}/></div>
        <div>
          <p>{this.props.collection.type}</p>
          <p>{this.props.collection.name}</p>
          <p><a href='#' onClick={this.clickArtist}>{this.props.collection.artist.name}</a></p>
          <p>{this.props.collection.date}</p>
        </div>
      </div>
    );
  }
}

export default ReleaseInfo;
