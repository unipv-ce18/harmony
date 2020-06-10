import {Component, createRef} from 'preact';

import {IconPlay, IconTrackNext, IconTrackPrev, IconTrackRepeat, IconTrackShuffle} from '../../../assets/icons/icons';
import IconButton from '../IconButton';
import Seekbar from '../Seekbar';

import style from './PagePlayer.scss';

class PagePlayer extends Component {

  titleLabelRef = createRef();
  artistLabelRef = createRef();

  componentWillEnter(done) {
    // Override default carousel animation
    done();
    return true;
  }

  componentWillLeave(done) {
    this.titleLabelRef.current.saveCurrentLocation();
    this.artistLabelRef.current.saveCurrentLocation();
    done();
    return true;
  }

  render({expanded, flipCtx: Flip}, context) {
    return (
      <div class={style.pagePlayer}>
        <img src={require('../../../assets/albumart_default.jpg')}/>
        {expanded &&
        <div class={style.songData}>
          <Flip.Node ref={this.titleLabelRef} group="page-player" tag="track-title" scale>
            <div>Best Song</div>
          </Flip.Node>
          <div>Da Album</div>
          <Flip.Node ref={this.artistLabelRef} group="page-player" tag="track-artist" scale>
            <div>A Fancy Artist</div>
          </Flip.Node>
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
