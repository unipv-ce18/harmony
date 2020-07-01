import {Component} from 'preact';
import image from '../collection/image.jpg'
import styles from './LibraryPage.scss';
import {route} from 'preact-router';

class ReleasesPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked : true
    };
  }

  clickArtist(id, e) {
    e.preventDefault();
    route('/artist/'+id);
  }

  clickRelease(id, e) {
    e.preventDefault();
    route('/release/'+id);
  }

  render() {
    return (
      <div className={styles.libraryCommon}>
        <div>
          {this.state.clicked && this.props.releases.map(item =>
              <span>
                <a href='#' onClick={this.clickRelease.bind(this, item.id)}><img src={image} alt={""}/></a>
                <p><a href='#' onClick={this.clickRelease.bind(this, item.id)}>{item.name}</a></p>
                <p>By <a href='#' onClick={this.clickArtist.bind(this, item.artist.id)}>{item.artist.name}</a></p>
              </span>)}
        </div>
      </div>
    );
  }
}
export default ReleasesPage;
