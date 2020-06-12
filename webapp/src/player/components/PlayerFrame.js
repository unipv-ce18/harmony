import {Component} from 'preact';
import PropTypes from 'prop-types';

import {classList} from '../../core/utils';
import {IconEqualizer, IconMusic, IconPlaylist} from '../../assets/icons/icons'
import Carousel from './Carousel';
import SelectorMenu from './SelectorMenu';
import MiniPlayer from './MiniPlayer';
import {PagePlayer, PagePlaylist, PageEqualizer} from './pages';

import {getExpandedSize, saveExpandedSize} from './playerUiPrefs';

import style from './PlayerFrame.scss';


const Pages = Object.freeze({
  PLAYER: {id: 'player', name: 'Now Playing', icon: IconMusic, Content: PagePlayer},
  PLAYLIST: {id: 'playlist', name: 'Playlists', icon: IconPlaylist, Content: PagePlaylist},
  EQUALIZER: {id: 'equalizer', name: 'Equalizer', icon: IconEqualizer, Content: PageEqualizer}
});
const PageData = Object.values(Pages);

class PlayerFrame extends Component {

  static propTypes = {
    /** Whenever the player is expanded or collapsed */
    expanded: PropTypes.bool
  }

  state = {
    resizing: false,
    currentPage: Pages.PLAYER.id
  }

  expandedSize = getExpandedSize();

  constructor() {
    super();
    this.onPageChange = this.onPageChange.bind(this);
  }

  render({expanded}, {resizing, currentPage}) {
    return (
      <div class={classList(style.player, resizing && style.sizing)} style={expanded && this.expandedSize}>
        {/* Carousel (page switcher) - overflow allows PagePlayer to fill the mini player area */}
        <Carousel class={style.pageView} selected={currentPage} overflow={currentPage === Pages.PLAYER.id}>
          {PageData.map(({id, Content}) => <Content key={id} expanded={expanded}/>)}
        </Carousel>

        {/* Playback controls when minimized or in playlist or EQ page */}
        <MiniPlayer mode={getMiniPlayerMode(currentPage, expanded)}/>

        {/* Page navigation bar - visible when expanded */}
        <SelectorMenu items={PageData} onSelection={this.onPageChange} visible={expanded}/>
      </div>
    );
  }

  onResize(width, height, end) {
    this.expandedSize = {width, height};
    this.setState({resizing: !end});
    if (end) saveExpandedSize(this.expandedSize);
  }

  onPageChange(currentPage) {
    this.setState({currentPage});
  }

}

function getMiniPlayerMode(currentPage, expanded) {
  if (!expanded) return MiniPlayer.Mode.DEFAULT;
  if (currentPage === Pages.PLAYER.id) return MiniPlayer.Mode.HIDDEN;
  return MiniPlayer.Mode.ALTERNATE;
}

export default PlayerFrame;
