import {Component} from 'preact';

import style from './PagePlaylist.scss'

class PageEqualizer extends Component {
  render() {
    return <span class={style.fallback}>Still no time for an EQ :(</span>;
  }
}

export default PageEqualizer;
