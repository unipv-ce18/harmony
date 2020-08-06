import {Component} from 'preact';
import styles from "./ArtistPage.scss";

class Tags extends Component {
  render({list}) {
    return (
      <div class={styles.tagsList}>
        {list.map(item => <span class={styles.tag} key={item.id}>{item}</span>)}
      </div>);
  }
}

export default Tags;
