const PREFS_STORE_KEY = 'player-ui-prefs';

const DEFAULT_EXPANDED_SIZE = {width: 400, height: 200};

export function getExpandedSize() {
  return JSON.parse(window.localStorage.getItem(PREFS_STORE_KEY)) || DEFAULT_EXPANDED_SIZE;
}

export function saveExpandedSize(size) {
  window.localStorage.setItem(PREFS_STORE_KEY, JSON.stringify(size));
}
