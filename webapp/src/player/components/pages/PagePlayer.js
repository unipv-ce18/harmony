import {Component, createRef} from 'preact';

import {classList} from '../../../core/utils';
import {IconPlay, IconPause, IconTrackNext, IconTrackPrev, IconTrackRepeat, IconTrackShuffle} from '../../../assets/icons/icons';
import {PlayerViewContextConsumer, FlipTags, FLIP_GROUP_PAGE_PLAYER} from '../PlayerViewContext';
import IconButton from '../IconButton';
import Seekbar from '../Seekbar';
import OverflowWrapper from '../OverflowWrapper';
import {getExpandedSize} from '../playerUiPrefs';
import PlayStates from '../../PlayStates';

import * as metrics from './playerPageMetrics';
import style from './PagePlayer.scss';

const TRANSITION_LEN = parseInt(style.playerTransitionLen);

const DEFAULT_ALBUMART_URL = require('../../../assets/albumart_default.jpg');

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

  render({expanded}, {visible}, {currentMedia, flipContext: Flip}) {
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
        <img src={currentMedia && currentMedia.mediaInfo.tags[MediaItemInfo.TAG_ALBUMART_URL] || DEFAULT_ALBUMART_URL}
             alt=""/>

        <div ref={this.#refs.songData} class={style.songData}>

          {/* Song title */}
          <OverflowWrapper style={this.#initialFontSize && {fontSize: this.#initialFontSize.title}}>
            {visible &&
            <Flip.Node ref={this.#refs.titleLabel} group={FLIP_GROUP_PAGE_PLAYER} tag={FlipTags.TRACK_TITLE} scale>
              <div>{currentMedia && currentMedia.mediaInfo.title}</div>
            </Flip.Node>
            }
          </OverflowWrapper>

          {/* Release */}
          <OverflowWrapper>
            <div>{currentMedia && currentMedia.mediaInfo.release}</div>
          </OverflowWrapper>

          {/* Artist  */}
          <OverflowWrapper style={this.#initialFontSize && {fontSize: this.#initialFontSize.artist}}>
            {visible &&
            <Flip.Node ref={this.#refs.artistLabel} group={FLIP_GROUP_PAGE_PLAYER} tag={FlipTags.TRACK_ARTIST} scale>
              <div>{currentMedia && currentMedia.mediaInfo.artist}</div>
            </Flip.Node>
            }
          </OverflowWrapper>

          {/* Seekbar */}
          <div class={style.seekbar}>
            <Seekbar showTime={true}/>
          </div>

          {/* Player controls */}
          <PagePlayerControls/>
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

class PagePlayerControls extends Component {

  #resizeObserver = new ResizeObserver(els => els.forEach(e => {
    e.target.style.width = e.contentRect.height + 'px';
  }));

  constructor() {
    super();
    this.onPlayClickHandler = this.onPlayClickHandler.bind(this);
  }

  componentDidMount() {
    this.base.querySelectorAll('span').forEach(e => this.#resizeObserver.observe(e));
  }

  componentWillUnmount() {
    this.base.querySelectorAll('span').forEach(e => this.#resizeObserver.unobserve(e));
  }

  render(props, state, {player, playState}) {
    const playing = playState === PlayStates.PLAYING;

    return (
      <div className={style.controls}>
        <div>
          <IconButton name="Repeat" icon={IconTrackRepeat} onClick={() => alert('Not implemented')}/>
        </div>
        <IconButton name="Previous" icon={IconTrackPrev} onClick={() => player.previous()}/>
        <IconButton name={playing ? "Pause" : "Play"} icon={playing ? IconPause : IconPlay}
                    onClick={this.onPlayClickHandler}/>
        <IconButton name="Next" icon={IconTrackNext} onClick={() => player.next()}/>
        <div>
          <IconButton name="Shuffle" icon={IconTrackShuffle} onClick={() => alert('Not implemented')}/>
        </div>
    </div>
    );
  }

  // TODO: Copypasta from MiniViewDefault
  onPlayClickHandler(e) {
    e.stopPropagation();
    const player = this.context.player;
    this.context.playState === PlayStates.PLAYING ? player.pause() : player.play();
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default PagePlayer;
