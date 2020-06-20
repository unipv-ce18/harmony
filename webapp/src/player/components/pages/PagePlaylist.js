import {Component} from 'preact';

import style from './PagePlaylist.scss';

class PagePlaylist extends Component {
  render() {
    return <span class={style.fallback}>Playlist coming soon</span>;
  }
}

export default PagePlaylist;
