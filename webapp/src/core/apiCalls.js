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
    return true;
  });
}

export function execRefresh(token) {
  return fetch(API_REFRESH_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function execSearch(token, type, query) {
  return fetch(`${API_SEARCH_URL}?q=${query}&t=${type}`, {
    headers: new Headers({'Authorization':'Bearer ' + token}),
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function getUserInfo(token, user_id, include_artists = false) {
  let query = API_USER_URL + user_id;
  if (include_artists) query += '?artists=1';
  return fetch(query, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
  });
}

export function changeUserType(token) {
  return fetch(API_USER_URL + 'type', {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function changeUserTier(token) {
  return fetch(API_USER_URL + 'tier', {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token})
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
  });
}

export function patchUser(token, user_id, bio, prefs) {
  const data = {bio, prefs};
  return fetch(API_USER_URL + user_id, {
    method: 'PATCH',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return;
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

export function getArtist(artist_id, with_releases, token) {
  // with_releases == true includes the songs in the result
  let query = API_ARTIST_URL + '/' + artist_id;
  if (with_releases) query += '?releases=1';
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
    return response.json();
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

export function createRelease(artist_id, name, token) {
  const data = {artist_id, name};
  return fetch(API_RELEASE_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return response.json();
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
