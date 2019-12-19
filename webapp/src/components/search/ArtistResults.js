import {Component} from "preact";
import {route} from "preact-router";
import styles from './SearchPage.scss';

class ArtistResults extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    route('/artist/' + this.props.artist.id );
    event.preventDefault();
  }


  render(props) {
    let artist = this.props.artist;
    return(
      <div class={styles.artistResult} style={{backgroundImage : "url('" + artist.image + "')"}}>
        <a href='#' onClick={this.handleClick}>{artist.name}</a>
      </div>
    );
  }
}

export default ArtistResults;
