import {mediaPlayer} from '../../Harmony';
import {PlayStartModes} from '../../player/MediaPlayer';
import {artistLink, createMediaItemInfo, releaseLink} from '../../core/links';
import {IconPlay, IconStarEmpty} from '../../assets/icons/icons';
import IconButton from '../IconButton';

import aStyle from './ArtistResult.scss';
import rStyle from './ReleaseResult.scss';
import sStyle from './SongResult.scss';

import play from '../../assets/play.png';

const GENRES_LIST_LENGTH = 2;

export const ArtistResult = ({content: artist}) => (
  <a class={aStyle.artistResult} style={{'--artist-img': `url(${artist.image})`}} href={artistLink(artist.id)}>
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

export const ReleaseResult = ({content: release}) => (
  <a class={rStyle.releaseResultWrap} style={{'--release-img': `url(${release.cover})`}} href={releaseLink(release.id)}>
    <div class={rStyle.releaseResult}>
      <div>
        <span>{release.name}</span>
        <span>
           <a href={artistLink(release.artist.id)}>{release.artist.name}</a>, {release.date}
        </span>
        <div>
          <IconButton name="Play all" size={24} icon={IconPlay} onClick={null}/>
          <IconButton name="Mark as favorite" size={24} icon={IconStarEmpty} onClick={null}/>
        </div>
      </div>
    </div>
  </a>
);

export const SongResult = ({content: song}) => {
  return (
    <a class={sStyle.songResult} href="#" onClick={onSongClick.bind(null, song)} title="Play Song">
      <div class={sStyle.songArt}>
        <img src={song.release.cover} alt=""/>
        <IconPlay/>
      </div>
      <div class={sStyle.songDetail}>
        {/*Put name also in title attribute to show full name on mouse hover in case of overflow*/}
        <span title={song.title}>{song.title}</span>
        <a href={artistLink(song.artist.id)}>{song.artist.name}</a>
        <div>
          <IconButton name="Mark as favorite" size={24} icon={IconStarEmpty} onClick={null}/>
        </div>
      </div>
    </a>
  );
}

function onSongClick(song, e) {
  e.preventDefault();  // Avoids scroll to top

  // Dirty hack to avoid starting playback if user pressed on the artist link
  if (e.target.nodeName === 'A' && e.target.textContent === song.artist.name) return;

  mediaPlayer.play(createMediaItemInfo(song), PlayStartModes.APPEND_QUEUE_AND_PLAY);

}
