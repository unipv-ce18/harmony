const API_LOGIN_URL = API_BASE_URL + '/auth/login';
const API_REGISTRATION_URL = API_BASE_URL + '/auth/register';
const API_LOGOUT_URL = API_BASE_URL + '/auth/logout';
const API_SEARCH_URL = API_BASE_URL + '/search';
const API_REFRESH_URL = API_BASE_URL + '/auth/refresh';
const API_RELEASE_URL = API_BASE_URL + '/release';
const API_PLAYLIST_URL = API_BASE_URL + '/playlist';
const API_ARTIST_URL = API_BASE_URL + '/artist';
const API_SONG_URL = API_BASE_URL + '/song';
const API_USER_URL = API_BASE_URL + '/user/';
const API_UPLOAD_URL = API_BASE_URL + '/upload';

export class ApiError extends Error {
  constructor(response) {
    super();
    this.name = 'ApiError';
    this.response = response;
  }
}

export function execLogin(identity, password) {
  const data = {identity, password};
  return fetch(API_LOGIN_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function execRegistration(email, username, password) {
  const data = {email, username, password};
  return fetch(API_REGISTRATION_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function execLogout(token) {
  return fetch(API_LOGOUT_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
  });
}

export function execRefresh(refreshToken) {
  return fetch(API_REFRESH_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + refreshToken}),
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function execSearch(token, query) {
  return fetch(`${API_SEARCH_URL}?query=${query}`, {
    headers: new Headers({'Authorization':'Bearer ' + token}),
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function getUserInfo(token, userId, includeArtists = false) {
  let query = API_USER_URL + userId;
  if (includeArtists) query += '?artists=1';
  return fetch(query, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function upgradeUserType(token) {
  return fetch(API_USER_URL + 'type', {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
  });
}

export function upgradeUserTier(token) {
  return fetch(API_USER_URL + 'tier', {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
  });
}

export function patchUser(token, userId, patch) {
  return fetch(API_USER_URL + userId, {
    method: 'PATCH',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(patch)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
  });
}

export function deleteUser(token, user_id) {
  return fetch(API_USER_URL + user_id, {
    method: 'DELETE',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
  });
}

export function getReleasePlaylist(type_collection, collection_id, with_song, token) {
  // with_song == true includes the songs in the result
  let query;
  type_collection==='release'
    ? query = API_RELEASE_URL + '/' + collection_id
    : query = API_PLAYLIST_URL + '/' + collection_id;
  if (with_song) query += '?songs=1';
  return fetch(query, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token}),
  }).then(response => {
      if (!response.ok) throw new ApiError(response);
      return response.json()
    })
}

export function getArtist(artistId, withReleases, token) {
  // with_releases == true includes the songs in the result
  let query = API_ARTIST_URL + '/' + artistId;
  if (withReleases) query += '?releases=1';
  return fetch(query, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token}),
  }).then(response => {
      if (!response.ok) throw new ApiError(response);
      return response.json()
    })
}

export function createArtist(name, token) {
  const data = {name};
  return fetch(API_ARTIST_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json().then(d => d['artist_id']);
  });
}

export function deleteArtist(artist_id, token) {
  return fetch(API_ARTIST_URL + '/' + artist_id, {
    method: 'DELETE',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function patchArtist(token, artist_id, patch) {
  return fetch(API_ARTIST_URL + '/' + artist_id, {
    method: 'PATCH',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(patch)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function createRelease(artistId, fields, token) {
  const data = {artist_id: artistId, ...fields};
  return fetch(API_RELEASE_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json().then(d => d['release_id']);
  });
}

export function deleteRelease(release_id, token) {
  return fetch(API_RELEASE_URL + '/' + release_id, {
    method: 'DELETE',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function patchRelease(token, release_id, patch) {
  return fetch(API_RELEASE_URL + '/' + release_id, {
    method: 'PATCH',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(patch)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function createSong(releaseId, uploadId, title, token) {
  const data = {release_id: releaseId, song_id: uploadId, title};
  return fetch(API_SONG_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function deleteSong(song_id, token) {
  return fetch(API_SONG_URL + '/' + song_id, {
    method: 'DELETE',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function getLibrary(user_id, token, full) {
  let query = API_USER_URL + user_id + '/library'
  if (full) query += '?full=1';
  return fetch(query, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token}),
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function setLike(function_type, token, media_type, media_id) {
  const data = {media_type, media_id};
  return fetch(API_USER_URL + 'library', {
    method: function_type,
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return true;
  });
}

export function getUserPlaylists(token) {
  return fetch(API_USER_URL + 'playlist', {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function createPlaylist(name, token) {
  const data = {name};
  return fetch(API_PLAYLIST_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function patchPlaylist(token, playlist_id, patch) {
  return fetch(API_PLAYLIST_URL + '/' + playlist_id, {
    method: 'PATCH',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(patch)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function updateSongInPlaylist(type_method, playlist_id, song_id, token) {
  let data;
  if (song_id !== null) data = {song_id};
  return fetch(API_PLAYLIST_URL + '/' + playlist_id, {
    method: type_method,
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return 'song added successfully';
  });
}

export function uploadContent(category, categoryId, mimeType, size, token) {
  const data = {category, category_id: categoryId, mimetype: mimeType, size};
  return fetch(API_UPLOAD_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function uploadToStorage(uploadContentResult, file) {
  const [bucket_url, data] = uploadContentResult;
  const body = new FormData();

  for (const [k, v] of Object.entries(data)) body.append(k, v);
  body.append('file', file);

  return fetch(bucket_url, {method: 'POST', body});
}
