import {getCurrentTime} from './utils'

const API_LOGIN_URL = API_BASE_URL + '/auth/login';
const API_REGISTRATION_URL = API_BASE_URL + '/auth/register';
const API_LOGOUT_URL = API_BASE_URL + '/auth/logout';
const API_RELEASE_URL = API_BASE_URL + '/release';

export function execLogin(username, password) {
  const data = {username, password};
  return fetch(API_LOGIN_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw Error(response);
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
    if (response.ok) return 200; else return response.json()
  });
}

export function execLogout() {
  const data = {};
  return fetch(API_LOGOUT_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(data)
  }).then(response => {
    return !!response.ok;
  });
}

export function getRelease(id) {
  const data = {id};
  return fetch(API_RELEASE_URL, {
    method: 'POST',
    headers: new Headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(data)
  }).then(response => {return response.json()})
}
