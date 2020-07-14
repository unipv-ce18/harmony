import {route} from 'preact-router';

const inputToUrl = text => text.replace(/[^a-z0-9]/gi, ' ').replace(/ /g, '+');
const inputFromUrl = text => text.replace(/\+/g, ' ');

export const isQueryEmpty = (text, modifiers) => text === '' && modifiers.length === 0;

export function toSearchUrlData(text, modifiers) {
  const modStrings = modifiers.map(m => m.key + (m.value != null ? `=${inputToUrl(m.value)}` : ''));
  return inputToUrl(text) + (modStrings.length > 0 ? `:${modStrings.join(',')}` : '');
}

export function fromSearchUrlData(data) {
  const [text, modStr] = data.split(':');

  const modifiers = modStr != null ? modStr.split(',').map(s => {
    const [key, value] = s.split('=');
    return {key, ...(value && {value: inputFromUrl(value)})};
  }) : []

  return {text: inputFromUrl(text), modifiers};
}

export function routeSearch(text, modifiers) {
  if (!isQueryEmpty(text, modifiers)) {
    route('/search/' + toSearchUrlData(text, modifiers));

  } else {
    // No query, redirect back to home page
    route('/')
  }
}
