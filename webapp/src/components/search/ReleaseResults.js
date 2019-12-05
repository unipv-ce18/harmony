import {Component} from "preact";
import {route} from "preact-router";
import styles from './SearchPage.scss';

class ReleaseResults extends Component {
  constructor(props) {
    super(props);
    this.handleClickRelease = this.handleClickRelease.bind(this);
    this.handleClickArtist = this.handleClickArtist.bind(this);
  }

  handleClickRelease(event) {
    route('/release/' + this.props.values.id );
    event.preventDefault();
  }

  handleClickArtist(event) {
    // DA RICONTROLLARE PER L'ID (come avere quello dell'artista?)
    route('/artist/' + this.props.values.id );
    event.preventDefault();
  }

  render(props, state, context) {
    return(
      <div class={styles.releaseResult}>
        <p class={styles.release}><a href='#' onClick={this.handleClickRelease}>{props.values.name}</a></p>
        <p class={styles.artist}><a href='#' onClick={this.handleClickArtist}>{props.values.artist}</a></p>
      </div>
    );
  }
}

export default ReleaseResults;
