import {Component} from 'preact';

import {classList} from '../../../core/utils';
import {PlayerViewContextConsumer} from '../PlayerViewContext';

import style from './PagePlaylist.scss';

class PagePlaylist extends Component {

  render(props, state, {player}) {
    return (
      <ul class={style.pagePlaylist}>
        {player.queue.map(item =>
          <li key={item.qid}
              class={classList(player.currentMediaQid === item.qid && style.current)}
              onDoubleClick={() => player.playFromQueue(item.qid)}>
            <span>{item.media.title}</span>
            <span>{item.media.artist}</span>
          </li>
        )}
      </ul>
    );
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default PagePlaylist;
