import {Component} from "preact";
import {route} from "preact-router";

class AlbumResults extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClickAlbum(event) {
    route('/album/' + this.props.values.id );
    event.preventDefault();
  }

  handleClickArtist(event) {
    // DA RICONTROLLARE PER L'ID (come avere quello dell'artista?)
    route('/artist/' + this.props.values.id );
    event.preventDefault();
  }

  render(props, state, context) {
    return(
      <div class={styles.albumResult}>
        <p class={styles.album}><a href='#' onClick={this.handleClickAlbum}>{props.values.name}</a></p>
        <p class={styles.artist}><a href='#' onClick={this.handleClickArtist}>{props.values.artist}</a></p>
      </div>
    );
  }
}

export default AlbumResults;
