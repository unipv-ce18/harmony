import {Component, createRef} from 'preact';

import {IconPlay, IconTrackNext, IconTrackPrev, IconTrackRepeat, IconTrackShuffle} from '../../../assets/icons/icons';
import IconButton from '../IconButton';
import Seekbar from '../Seekbar';
import {getBoxFontSize, predictArtistFontSize, predictSongDataDomSize, predictTitleFontSize} from './playerPageMetrics';
import {getExpandedSize} from '../playerUiPrefs';

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
    const size = getBoxFontSize(e.contentRect);
    e.target.style.fontSize = size + 'px';
  }));

  // Will need these pre-calculated before expansion to implement FLIP animations properly
  #initialFontSize = null;

  componentWillEnter(done) {
    // Override default carousel animation
    done();
    return true;
  }

  componentWillLeave(done) {
    // Save these before leaving for smooth transition to other pages
    this.#refs.titleLabel.current.saveCurrentLocation();
    this.#refs.artistLabel.current.saveCurrentLocation();

    done();
    return true;
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    // Invalidate font sizes in case we resized the player before collapsing
    if (nextProps.expanded === false) this.#initialFontSize = null;
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    if (this.props.expanded) {
      // Bind resize observer only at animation end
      setTimeout(() => {
        const songData = this.#refs.songData.current;
        if (songData) {
          Array.from(songData.children)
            .slice(0, 3)
            .forEach(e => this.#resizeObserver.observe(e));
        }
      }, TRANSITION_LEN);
    }
  }

  render({expanded, flipCtx: Flip}, context) {
    if (expanded && this.#initialFontSize == null) {
      // Recalculate initial font sizes if needed
      const sdSize = predictSongDataDomSize(getExpandedSize());
      this.#initialFontSize = {title: predictTitleFontSize(sdSize), artist: predictArtistFontSize(sdSize)};
    }

    return (
      <div class={style.pagePlayer}>
        <img src={require('../../../assets/albumart_default.jpg')}/>
        {expanded &&
        <div ref={this.#refs.songData} class={style.songData}>
          <div style={{fontSize: this.#initialFontSize.title}}>
            <Flip.Node ref={this.#refs.titleLabel} group="page-player" tag="track-title" scale>
              <div>Best Song</div>
            </Flip.Node>
          </div>
          <div>
            <div>Da Album</div>
          </div>
          <div style={{fontSize: this.#initialFontSize.artist}}>
            <Flip.Node ref={this.#refs.artistLabel} group="page-player" tag="track-artist" scale>
              <div>A Fancy Artist</div>
            </Flip.Node>
          </div>
          <div class={style.seekbar}>
            <span>0.00</span>
            <Seekbar/>
            <span>4.05</span>
          </div>
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
        }
      </div>
    );
  }

}

export default PagePlayer;
