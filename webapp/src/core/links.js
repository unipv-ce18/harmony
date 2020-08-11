import {MediaItemInfo} from '../player/MediaPlayer';

export const artistLink = id => `/artist/${id}`;

export const releaseLink = id => `/release/${id}`;

export const playlistLink = id => `/playlist/${id}`;

export const userLink = id => `/user/${id}`;

// Not really a link but allows "linking" to the player given a song model
export function createMediaItemInfo(song, release = null, artist = null) {
  return new MediaItemInfo(song.id, {
    [MediaItemInfo.TAG_TITLE]: song.title,
    [MediaItemInfo.TAG_RELEASE]: (release || song.release).name,
    [MediaItemInfo.TAG_ARTIST]: (artist || song.artist).name,
    [MediaItemInfo.TAG_ALBUMART_URL]: (release || song.release).cover
  });
}
