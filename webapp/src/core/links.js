import {MediaItemInfo} from '../player/MediaPlayer';

export const artistLink = id => `/artist/${id}`;

export const releaseLink = id => `/release/${id}`;

export const playlistLink = id => `/playlist/${id}`;

export const userLink = id => `/user/${id}`;

export const userLibraryLink = id => `/library/${id}`;

// Not really a link but allows "linking" to the player given a song model
/**
 * Creates a {@link MediaItemInfo} object for playback given a song model
 *
 * @param song The song to convert
 * @param release A release object to use when the song object has no references
 * @return {MediaItemInfo} A media info object to pass to the player
 */
export function createMediaItemInfo(song, release = null) {
  return new MediaItemInfo(song.id, {
    [MediaItemInfo.TAG_TITLE]: song.title,
    [MediaItemInfo.TAG_RELEASE]: (release || song.release).name,
    [MediaItemInfo.TAG_ARTIST]: (release ? release.artist : song.artist).name,
    [MediaItemInfo.TAG_ALBUMART_URL]: (release || song.release).cover
  });
}
