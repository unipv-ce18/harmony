import {Component} from 'preact';

import {classList, removeArrayElement} from '../../../core/utils';
import {PlayerViewContextConsumer} from '../PlayerViewContext';

import style from './PagePlaylist.scss';

class PagePlaylist extends Component {

  state = {selected: []};

  constructor() {
    super();
    this.onListKeyUp = this.onListKeyUp.bind(this);
  }

  render(props, {selected}, {player}) {
    return (
      <ul class={style.pagePlaylist} tabIndex={1}
          onClick={e => e.target === this.base && this.setState({selected: []})}
          onKeyUp={this.onListKeyUp}>
        {player.queue.map(item =>
          <li key={item.qid}
              class={classList(player.currentMediaQid === item.qid && style.current,
                               selected.includes(item.qid) && style.selected)}
              onClick={this.onItemClick.bind(this, item.qid)}
              onDoubleClick={() => player.playFromQueue(item.qid)}>
            <span>{item.media.title}</span>
            <span>{item.media.artist}</span>
          </li>
        )}
      </ul>
    );
  }

  onItemClick(qid, e) {
    const {selected} = this.state;

    // Multi selection
    if (e.ctrlKey) {
      if (selected.includes(qid))
        removeArrayElement(selected, qid);
      else
        selected.push(qid);
      this.setState({selected});
      return;
    }

    // Range selection
    if (e.shiftKey && selected.length > 0) {
      const queue = this.context.player.queue;
      const a = queue.findIndex(i => i.qid === selected[selected.length - 1]);
      const b = queue.findIndex(i => i.qid === qid);

      console.log(selected[selected.length - 1]);
      console.log(a,b);
      this.setState({selected: queue.slice(Math.min(a,b), Math.max(a,b) + 1).map(i => i.qid)});
      return;
    }

    // Single selection
    this.setState({selected: [qid]});
  }

  onListKeyUp(e) {
    if (e.code === 'KeyA' && e.ctrlKey) {
      this.setState({selected: this.context.player.queue.map(i => i.qid)});

    } else if (e.code === 'Escape') {
      this.setState({selected: []});

    } else if (e.code === 'Delete') {
      const toRemove = this.state.selected;
      this.setState({selected: []}, () => {
        this.context.player.removeFromQueue(toRemove);
        this.forceUpdate();
      });
    }
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default PagePlaylist;
