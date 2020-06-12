import {Component, createRef} from 'preact';

import {classList} from '../../../core/utils';
import {IconPlay, IconTrackNext, IconTrackPrev, IconTrackRepeat, IconTrackShuffle} from '../../../assets/icons/icons';
import {PlayerViewContextConsumer, FlipTags, FLIP_GROUP_PAGE_PLAYER} from '../PlayerViewContext';
import IconButton from '../IconButton';
import Seekbar from '../Seekbar';
import {getExpandedSize} from '../playerUiPrefs';

import * as metrics from './playerPageMetrics';
import style from './PagePlayer.scss';

const TRANSITION_LEN = parseInt(style.playerTransitionLen);

class PagePlayer extends Component {

  #refs = {
    songData: createRef(),  // to bind its children to ResizeObserver
    titleLabel: createRef(),  // to calculate their FLIP size before leaving
    artistLabel: createRef()
  }

  #resizeObserver = new ResizeObserver(els => els.forEach(e => {
    // e.contentBoxSize only implemented by Firefox
    const size = metrics.getBoxFontSize(e.contentRect);
    e.target.style.fontSize = size + 'px';
  }));

  // Will need these pre-calculated before expansion to implement FLIP animations properly
  #initialFontSize = null;

  state = {
    visible: false
  }

  componentWillReceiveProps(nextProps, nextContext) {
    // Invalidate font sizes in case we resized the player before collapsing
    if (nextProps.expanded === false) this.#initialFontSize = null;

    // Detect expand/collapse and set visible accordingly
    if (nextProps.expanded !== this.props.expanded)
      this.#setVisibleState(nextProps.expanded);
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    // If visibility changes, bind/unbind resize observer over title, album, artist labels
    if (this.state.visible !== previousState.visible) {
      const songData = this.#refs.songData.current;
      if (this.state.visible) {
        // Bind resize observer only at animation end
        setTimeout(() => {
          Array.from(songData.children).slice(0, 3)
            .forEach(e => this.#resizeObserver.observe(e));
        }, TRANSITION_LEN);
      } else {
        Array.from(songData.children).slice(0, 3)
          .forEach(e => this.#resizeObserver.unobserve(e));
      }
    }
  }

  componentWillEnter(done) {
    // Override default carousel animation
    this.#setVisibleState(true);

    done();
    return true;
  }

  componentWillLeave(done) {
    // Save these before leaving for smooth transition to other pages
    this.#setVisibleState(false);

    setTimeout(done, TRANSITION_LEN);
    return true;
  }

  render({expanded}, {visible}, {flipContext: Flip}) {
    if (expanded && this.#initialFontSize == null) {
      // Recalculate initial font sizes if needed
      const sdSize = metrics.predictSongDataDomSize(getExpandedSize());
      this.#initialFontSize = {
        title: metrics.predictTitleFontSize(sdSize),
        artist: metrics.predictArtistFontSize(sdSize)
      };
    }

    return (
      <div class={classList(style.pagePlayer, visible && style.visible)}>

        {/* Album art */}
        <img src={require('../../../assets/albumart_default.jpg')} alt=""/>

        <div ref={this.#refs.songData} class={style.songData}>

          {/* Song title */}
          <div style={this.#initialFontSize && {fontSize: this.#initialFontSize.title}}>
            {visible &&
            <Flip.Node ref={this.#refs.titleLabel} group={FLIP_GROUP_PAGE_PLAYER} tag={FlipTags.TRACK_TITLE} scale>
              <div>Best Song</div>
            </Flip.Node>
            }
          </div>

          {/* Release */}
          <div>
            <div>Da Album</div>
          </div>

          {/* Artist  */}
          <div style={this.#initialFontSize && {fontSize: this.#initialFontSize.artist}}>
            {visible &&
            <Flip.Node ref={this.#refs.artistLabel} group={FLIP_GROUP_PAGE_PLAYER} tag={FlipTags.TRACK_ARTIST} scale>
              <div>A Fancy Artist</div>
            </Flip.Node>
            }
          </div>

          {/* Seekbar */}
          <div class={style.seekbar}>
            <span>0.00</span>
            <Seekbar enabled={visible}/>
            <span>4.05</span>
          </div>

          {/* Player controls */}
          <div class={style.controls}>
            <div>
              <IconButton name="Repeat" size={16} icon={IconTrackRepeat}/>
            </div>
            <IconButton name="Previous" size={32} icon={IconTrackPrev}/>
            <IconButton name="Play" size={32} icon={IconPlay}/>
            <IconButton name="Next" size={32} icon={IconTrackNext}/>
            <div>
              <IconButton name="Shuffle" size={16} icon={IconTrackShuffle}/>
            </div>
          </div>

        </div>
      </div>
    );
  }

  #setVisibleState(visible) {
    if (visible === false) {
      // Save label metrics if we are leaving (does not work if we do in componentWillUpdate)
      this.#refs.titleLabel.current.saveCurrentMetrics();
      this.#refs.artistLabel.current.saveCurrentMetrics();
    }

    this.setState({visible});
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default PagePlayer;
