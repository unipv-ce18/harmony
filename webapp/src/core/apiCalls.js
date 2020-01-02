import {getCurrentTime} from './utils'

const API_LOGIN_URL = API_BASE_URL + '/auth/login';
const API_REGISTRATION_URL = API_BASE_URL + '/auth/register';
const API_LOGOUT_URL = API_BASE_URL + '/auth/logout';
const API_RELEASE_URL = API_BASE_URL + '/release';
const API_ARTIST_URL = API_BASE_URL + '/artist';

export class ApiError extends Error {
  constructor(response) {
    super();
    this.name = 'ApiError';
    this.response = response;
  }
}

export function execLogin(username, password) {
  const data = {username, password};
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

export function execLogout() {
  const data = {};
  return fetch(API_LOGOUT_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new ApiError(response);
    return true;
  });
}

export function getRelease(id, with_song) {
  // with_song == true includes the songs in the result
  let query = API_RELEASE_URL + '/' + id;
  if (with_song) query += '?songs=1';
  return fetch(query)
    .then(response => {
      return response.json()
    })
}

export function getArtist(id, with_releases) {
  // with_releases == true includes the releases in the result
  let query = API_ARTIST_URL + '/' + id;
  if (with_releases) query += '?releases=1';
  return fetch(query)
    .then(response => {
      return response.json()
    })
}
