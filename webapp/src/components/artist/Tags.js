import {Component} from 'preact';
import styles from "./ArtistPage.scss";
import SongResults from "../search/SongResults";
class Tags extends Component {
  render({list}) {
    return (
      <div class={styles.tags}>
        {list.map(item => <span class={styles.tagButton} key={item.id}>{item}</span>)}
      </div>);
  }
}

export default Tags;
