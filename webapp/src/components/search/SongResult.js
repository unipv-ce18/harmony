import {Component} from "preact";

import {mediaPlayer} from '../../Harmony';
import {artistLink, createMediaItemInfo} from '../../core/links';

import style from './SearchPage.scss';
import play from "../../assets/play.png";

class SongResult extends Component {
  constructor(props) {
    super(props);
    this.handleClickSong = this.handleClickSong.bind(this);
  }

  handleClickSong(_) {
    mediaPlayer.play(createMediaItemInfo(this.props.content), PlayStartModes.APPEND_QUEUE_AND_PLAY);
  }

  render({content: song}) {
    return(
      <div class={style.songResult}>
        <div class={style.songImage} style={{backgroundImage : "url('" + song.release.cover + "')"}}>
          <img class={style.image} src={play} alt="Play" onClick={this.handleClickSong}/>
        </div>
        <span>
          <p class={style.song}><a href='#' onClick={this.handleClickSong}>{song.title}</a></p>
          <p class={style.artistSong}><a href={artistLink(song.artist.id)}>{song.artist.name}</a></p>
        </span>
      </div>
    );
  }
}

export default SongResult;
