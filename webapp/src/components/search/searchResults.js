import {Component} from 'preact';

import {catalog, mediaPlayer, session} from '../../Harmony';
import {PlayStartModes} from '../../player/MediaPlayer';
import {classList} from '../../core/utils';
import {artistLink, releaseLink, playlistLink, userLink, createMediaItemInfo} from '../../core/links';
import {getReleasePlaylist} from '../../core/apiCalls';
import {IconPlay, IconStarEmpty, IconStarFull} from '../../assets/icons/icons';
import PlaylistImage from '../collection/PlaylistImage';
import {DEFAULT_ARTIST_IMAGE_URL} from '../../assets/defaults'
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
  if (src == null) return callback();  // No loading for default image
  const img = new Image();
  img.onload = callback;
  img.src = src;
}

function withLibrary(mediaType) {
  return Child => class extends Component {
    constructor(props) {
      super(props);
      this.state = {inLibrary: catalog.inLibrary(mediaType, props.content.id)}
    }
    render(props, {inLibrary}) {
      return (
        <Child inLibrary={inLibrary} setInLibrary={inLibrary => {
          catalog.favorite(inLibrary ? 'PUT' : 'DELETE', mediaType, props.content.id)
            .then(() => this.setState({inLibrary}));
        }} {...props}/>
      );
    }
  };
}

function withImageLoader(imageSource) {
  return Child => class extends Component {
    state = {loading: true};
    componentDidMount() {
      onImageLoad(imageSource(this.props.content), () => this.setState({loading: false}));
    }
    render(props, {loading}) {
      return (<Child imageLoading={loading} {...props}/>);
    }
  }
}

const LibraryButton = ({inLibrary, setInLibrary}) => (
  <IconButton size={24}
              name={inLibrary ? 'Remove from library' : 'Add to library'}
              icon={inLibrary ? IconStarFull : IconStarEmpty}
              onClick={e => {
                e.preventDefault();  // Prevents <a> routing
                e.stopPropagation();  // Prevents router routing
                setInLibrary(!inLibrary);
              }}/>
);

const PlayCollectionButton = ({id, type}) => (
  <IconButton name="Play all" size={24} icon={IconPlay} onClick={e => {
    e.preventDefault();
    e.stopPropagation();

    session.getAccessToken()
      .then(token => getReleasePlaylist(type, id, true, token))
      .then(collection => // Pass release when song does not have release/artist reference
        collection.songs.map(song => createMediaItemInfo(song, type === 'release' ? collection : null)))
      .then(mediaItems => mediaPlayer.play(mediaItems, PlayStartModes.APPEND_QUEUE_AND_PLAY));
  }}/>
)

const ArtistResultView = ({content: artist, imageLoading, ...props}) => (
  <a class={classList(aStyle.artistResult, imageLoading && 'loading')}
     style={{'--artist-img': `url(${artist.image ?? DEFAULT_ARTIST_IMAGE_URL})`}} href={artistLink(artist.id)}>
    <div>
      <span>{artist.name}</span>
      <span>{artist.genres && artist.genres.slice(0, GENRES_LIST_LENGTH).join(', ')}</span>
      <div>
        {/*<IconButton name="Play all" size={24} onClick={null} icon={IconPlay}/>*/}
        <LibraryButton {...props}/>
      </div>
    </div>
  </a>
);

const ReleaseResultView = ({content: release, imageLoading, ...props}) => (
  <a class={rStyle.releaseResultWrap} style={{'--release-img': `url(${release.cover})`}} href={releaseLink(release.id)}>
    <div class={classList(rStyle.releaseResult, imageLoading && 'loading')}>
      <div>
        <span>{release.name}</span>
        <span>
         <a href={artistLink(release.artist.id)}>{release.artist.name}</a>{release.date && `, ${release.date}`}
      </span>
        <div>
          <PlayCollectionButton id={release.id} type="release"/>
          <LibraryButton {...props}/>
        </div>
      </div>
    </div>
  </a>
);

const SongResultView = ({content: song, imageLoading, ...props}) => (
  <a class={classList(sStyle.songResult, imageLoading && 'loading')} href="#" onClick={onSongClick.bind(null, song)}>
    <div class={sStyle.songArt} title="Play Song">
      <img src={song.release.cover} alt=""/>
      <IconPlay title="bla"/>
    </div>
    <div class={sStyle.songDetail}>
      {/*Put name also in title attribute to show full name on mouse hover in case of overflow*/}
      <span title={song.title}>{song.title}</span>
      <a href={artistLink(song.artist.id)}>{song.artist.name}</a>
      <div>
        <LibraryButton {...props}/>
      </div>
    </div>
  </a>
);

const PlaylistResultView = ({content: playlist, ...props}) => (
  <a class={pStyle.playlistResult} href={playlistLink(playlist.id)} title={playlist.name}>
    <div class={pStyle.imgWrap}>
      <PlaylistImage images={playlist.images}/>
    </div>
    <div class={pStyle.titlePane}>
      <span>{playlist.name}</span>
      <div>
        <PlayCollectionButton id={playlist.id} type="getReleasePlaylist does not care"/>
        <LibraryButton {...props}/>
      </div>
    </div>
    <div className={pStyle.byLink}>
      by <a href={userLink(playlist.creator.id)}>{playlist.creator.username}</a>
    </div>
  </a>
);

const enhance = (mediaType, imageField) => c => withLibrary(mediaPlayer)(withImageLoader(imageField)(c));

export const ArtistResult = enhance('artists', c => c.image)(ArtistResultView);
export const ReleaseResult = enhance('releases', c => c.cover)(ReleaseResultView);
export const SongResult = enhance('songs', c => c.release.cover)(SongResultView);
export const PlaylistResult = withLibrary('playlists')(PlaylistResultView);
