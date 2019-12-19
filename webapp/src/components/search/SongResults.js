import {Component} from "preact";
import styles from './SearchPage.scss';
import {route} from "preact-router";
import play from "../../assets/play.png";

class SongResults extends Component {
  constructor(props) {
    super(props);
    this.handleClickSong = this.handleClickSong.bind(this);
    this.handleClickArtist = this.handleClickArtist.bind(this);
  }

  handleClickSong(event) {
//  Avviare la canzone
  }

  handleClickArtist(event) {
    route('/artist/' + this.props.song.artist.id );
    event.preventDefault();
  }

  render(props, state, context) {
    let song = this.props.song;
    return(
      <div class={styles.songResult}>
        <div class={styles.songImage} style={{backgroundImage : "url('" + song.release.cover + "')"}}><img class={styles.image} src={play} onClick={this.handleClickSong}/></div>
        <span><p class={styles.song}><a href='#' onClick={this.handleClickSong}>{song.title}</a></p>
          <p class={styles.artistSong}><a href='#' onClick={this.handleClickArtist}>{song.artist.name}</a></p></span>
      </div>
    );
  }
}

export default SongResults;
