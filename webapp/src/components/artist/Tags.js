import {Component} from 'preact';
import {route} from 'preact-router';

import styles from './ArtistPage.scss';

class Tags extends Component {

  clickGenre(genre, e) {
     e.preventDefault();
     route('/search/:genre=' + genre.replace(' ', '+'));
  }

  render({list}) {
    return (
      <div class={styles.tagsList}>
        {list.map(item => item!==null && <button onClick={this.clickGenre.bind(this, item)}><span class={styles.tag} key={item.id}>{item}</span></button>)}
      </div>);
  }
}

export default Tags;
