import {Component} from 'preact';
import styles from './LibraryPage.scss';
import {route} from 'preact-router';
import emptyImage from './image.jpg'

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
      <div>
        {this.props.releases.length > 0 &&
        <div className={styles.libraryCommon}>
          {this.state.clicked && this.props.releases.map(release =>
            <span>
              <a href='#' onClick={this.clickRelease.bind(this, release.id)}>
                <img src={release.cover ? release.cover : emptyImage} alt={""}/></a>
              <p><a href='#' onClick={this.clickRelease.bind(this, release.id)}>{release.name}</a></p>
              <p>By <a href='#' onClick={this.clickArtist.bind(this, release.artist.id)}>{release.artist.name}</a></p>
            </span>)}
        </div>
        }
      </div>
    );
  }
}
export default ReleasesPage;
