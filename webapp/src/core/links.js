import {MediaItemInfo} from '../player/MediaPlayer';

export const artistLink = id => `/artist/${id}`;

export const releaseLink = id => `/release/${id}`;

export const playlistLink = id => `/playlist/${id}`;

export const userLink = id => `/user/${id}`;

// Not really a link but allows "linking" to the player given a song model
export function createMediaItemInfo(song) {
  return new MediaItemInfo(song.id, {
    [MediaItemInfo.TAG_TITLE]: song.title,
    [MediaItemInfo.TAG_RELEASE]: song.release.name,
    [MediaItemInfo.TAG_ARTIST]: song.artist.name,
    [MediaItemInfo.TAG_ALBUMART_URL]: song.release.cover
  });
}
