import {Component} from "preact";

import {artistLink} from '../../core/links';

import style from './SearchPage.scss';

class ArtistResult extends Component {

  render({content: artist}) {
    return(
      <div class={style.artistResult} style={{backgroundImage : "url('" + artist.image + "')"}}>
        <a href={artistLink(artist.id)}>{artist.name}</a>
      </div>
    );
  }
}

export default ArtistResult;
