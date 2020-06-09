import {Component} from 'preact';
import styles from './LibraryPage.scss';
import {catalog} from '../../Harmony';

class SongsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clicked : true,
      songs: [...this.props.songs]
    };
  }

  compare(a, b) {
      if (a < b) return -1;
      else if (a > b) return 1;
      else return 0;
    }

  reorderList(type) {
    this.setState({clicked:false});
    if(type === 'date') this.setState({songs:[...this.props.songs]});
    if(type === 'title') this.state.songs.sort((a, b) => this.compare(a.title, b.title));
    if(type === 'artist') this.state.songs.sort((a, b) => this.compare(a.artist.name, b.artist.name));
    if(type === 'release') this.state.songs.sort((a, b) => this.compare(a.release.name, b.release.name));
    this.setState({clicked:true});
  }

  render() {
    return (
      <div className={styles.librarySongs}>
        <table>
          <tr>
            <th></th>
            <th><button onClick={() => this.reorderList('title')}>Title</button></th>
            <th><button onClick={() => this.reorderList('artist')}>Artist</button></th>
            <th><button onClick={() => this.reorderList('release')}>Release</button></th>
            <th><button onClick={() => this.reorderList('artist')}>Time</button></th>
          </tr>
          {this.state.clicked && this.state.songs.map(item =>
            <tr>
              <td></td>
              <td>{item.title }</td>
              <td>{item.artist.name}</td>
              <td>{item.release.name}</td>
              <td/>
            </tr>
          )}
        </table>
      </div>
    );
  }
}

export default SongsPage;
