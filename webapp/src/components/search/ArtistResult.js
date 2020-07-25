import {Component} from "preact";

import {artistLink} from '../../core/links';
import {IconPlay, IconStarEmpty} from '../../assets/icons/icons';
import IconButton from '../IconButton';

import style from './SearchPage.scss';

const GENRES_LIST_LENGTH = 2;

class ArtistResult extends Component {

  render({content: artist}) {
    console.log(artist)
    return(
      <a class={style.artistResult} style={{'--artist-img': `url(${artist.image})`}} href={artistLink(artist.id)}>
        <div>
          <span>{artist.name}</span>
          <span>{artist.genres.slice(0, GENRES_LIST_LENGTH).join(', ')}</span>
          <div>
            <IconButton name="Play all" size={24} icon={IconPlay} onClick={null}/>
            <IconButton name="Mark as favorite" size={24} icon={IconStarEmpty} onClick={null}/>
          </div>
        </div>
      </a>
    );
  }
}

export default ArtistResult;
