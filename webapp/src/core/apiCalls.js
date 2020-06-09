import {getCurrentTime} from './utils'
import {API_BASE_URL} from '../../harmony-webapp.conf';

const API_LOGIN_URL = API_BASE_URL + '/auth/login';
const API_REGISTRATION_URL = API_BASE_URL + '/auth/register';
const API_LOGOUT_URL = API_BASE_URL + '/auth/logout';
const API_REFRESH_URL = API_BASE_URL + '/auth/refresh';
const API_RELEASE_URL = API_BASE_URL + '/release';
const API_ARTIST_URL = API_BASE_URL + '/artist';
const API_LIBRARY_URL = API_BASE_URL + '/user/';

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

export function getRelease(id, with_song, token) {
  // with_song == true includes the songs in the result
  let query = API_RELEASE_URL + '/' + id;
  if (with_song) query += '?songs=1';
  return fetch(query, {
    method: 'GET',
    headers: new Headers({'Accept': 'application/json', 'Authorization':'Bearer ' + token}),
  }).then(response => {
      if (!response.ok) throw new ApiError(response);
      return response.json()
    })
}

export function getArtist(id, with_releases) {
  // with_releases == true includes the releases in the result
  let query = API_ARTIST_URL + '/' + id;
  if (with_releases) query += '?releases=1';
  return fetch(query)
    .then(response => {
      if (!response.ok) throw new ApiError(response);
      return response.json()
    })
}

export function getLibrary(user_id, token, full) {
  let query = API_LIBRARY_URL + user_id + '/library'
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
  return fetch(API_LIBRARY_URL + 'library', {
    method: function_type,
    headers: new Headers({'Content-Type': 'application/json', 'Authorization':'Bearer ' + token}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
  });
}
