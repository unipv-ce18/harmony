import {Component} from 'preact';
import image from '../release/image.jpg'
import styles from './LibraryPage.scss';
import {route} from 'preact-router';

class ReleasesPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked : true,
      releases: [...this.props.releases]
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
          {this.state.clicked && this.state.releases.map(item =>
              <span>
                <img src={image} alt={""}/>
                <p><a href='#' onClick={this.clickRelease.bind(this, item.id)}>{item.name}</a></p>
                <p>By <a href='#' onClick={this.clickArtist.bind(this, item.artist.id)}>{item.artist.name}</a></p>
              </span>)}
      </div>
    );
  }
}
export default ReleasesPage;
