module.exports = {
  // APP name as shown throughout the app
  APPLICATION_NAME: "Harmony",

  // Theme used when the user is not logged in or when no preference is set - others available in components/theme.ts
  DEFAULT_THEME: 'adaptive',

  // URLs for connecting to the backend
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost/api/v1',
  PLAYER_SOCKET_URL: process.env.PLAYER_SOCKET_URL || 'http://localhost/playback',

  // Path and name of Harmony's service worker
  SERVICE_WORKER_PATH: 'sw.js'
};
