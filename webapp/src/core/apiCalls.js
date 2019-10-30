import {getCurrentTime} from './utils'

const API_LOGIN_URL = API_BASE_URL + '/auth/login';

export function execLogin(username, password) {
  // TODO: Temporary dummy data to for testing
  return Promise.resolve({
    'access_token': 'a',
    'expires_in': String(10),
    'token_type': 'bearer'});

  /*
  const headers = new Headers({'Authorization': 'Basic ' + btoa(username + ':' + password)});

  return fetch(API_LOGIN_URL, {method: 'GET', headers})
    .then(response => {
      if (!response.ok) throw Error('Authentication failed: ' + response.statusText);
      return response.json();
    });
  */
}
