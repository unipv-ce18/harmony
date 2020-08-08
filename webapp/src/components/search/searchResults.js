import {useState} from 'preact/hooks';

import {mediaPlayer} from '../../Harmony';
import {PlayStartModes} from '../../player/MediaPlayer';
import {classList} from '../../core/utils';
import {artistLink, releaseLink, playlistLink, userLink, createMediaItemInfo} from '../../core/links';
import {IconPlay, IconStarEmpty} from '../../assets/icons/icons';
import PlaylistImage from '../collection/PlaylistImage';
import IconButton from '../IconButton';

import aStyle from './ArtistResult.scss';
import rStyle from './ReleaseResult.scss';
import sStyle from './SongResult.scss';
import pStyle from './PlaylistResult.scss';

const GENRES_LIST_LENGTH = 2;

function onSongClick(song, e) {
  e.preventDefault();  // Avoids scroll to top

  // Dirty hack to avoid starting playback if user pressed on the artist link
  if (e.target.nodeName === 'A' && e.target.textContent === song.artist.name) return;

  mediaPlayer.play(createMediaItemInfo(song), PlayStartModes.APPEND_QUEUE_AND_PLAY);

}

function onImageLoad(src, callback) {
  const img = new Image();
  img.onload = callback;
  img.src = src;
}

export const ArtistResult = ({content: artist}) => {
  const [loading, setLoading] = useState(true);
  onImageLoad(artist.image, () => setLoading(false));

  return (
    <a class={classList(aStyle.artistResult, loading && 'loading')}
       style={{'--artist-img': `url(${artist.image})`}} href={artistLink(artist.id)}>
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

export const ReleaseResult = ({content: release}) => {
  const [loading, setLoading] = useState(true);
  onImageLoad(release.cover, () => setLoading(false));

  return (
    <a class={rStyle.releaseResultWrap} style={{'--release-img': `url(${release.cover})`}} href={releaseLink(release.id)}>
      <div class={classList(rStyle.releaseResult, loading && 'loading')}>
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
}

export const SongResult = ({content: song}) => {
  const [loading, setLoading] = useState(true);

  return (
    <a class={classList(sStyle.songResult, loading && 'loading')} href="#" onClick={onSongClick.bind(null, song)}>
      <div class={sStyle.songArt} title="Play Song">
        <img src={song.release.cover} alt="" onLoad={() => setLoading(false)}/>
        <IconPlay title="bla"/>
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

export const PlaylistResult = ({content: playlist}) => (
  <a class={pStyle.playlistResult} href={playlistLink(playlist.id)} title={playlist.name}>
    <div class={pStyle.imgWrap}>
      <PlaylistImage images={playlist.images}/>
    </div>
    <div class={pStyle.titlePane}>
      <span>{playlist.name}</span>
      <div>
        <IconButton name="Play all" size={24} icon={IconPlay} onClick={null}/>
        <IconButton name="Mark as favorite" size={24} icon={IconStarEmpty} onClick={null}/>
      </div>
    </div>
    <div className={pStyle.byLink}>
      by <a href={userLink(playlist.creator.id)}>{playlist.creator.username}</a>
    </div>
  </a>
);
