module.exports = {
  APPLICATION_NAME: "Harmony",
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost/api/v1',
  PLAYER_SOCKET_URL: process.env.PLAYER_SOCKET_URL || 'http://localhost/playback',
  SERVICE_WORKER_PATH: 'sw.js'
};
