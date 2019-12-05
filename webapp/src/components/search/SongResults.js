import {Component} from "preact";
import styles from './SearchPage.scss';

class SongResults extends Component {
  render(props, state, context) {
    return(
      <div>
        <p>Song name: {props.values.title}</p>
        <p>Artist: {props.values.artist}</p>
      </div>
    );
  }
}

export default SongResults;
