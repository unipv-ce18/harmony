import io from 'socket.io-client'

const TAG = '[Download.SocketConnection]';

let pendingReqResolve = null;

export function createSocket(socketUrl, accessToken) {
    const socket = io(socketUrl, {
        transports: ['websocket'],
        query: {access_token: accessToken}
    });

    // On reconnection, fall back to polling
    socket.on('reconnect_attempt', () => {
        console.warn(TAG, 'Attempting reconnect with polling transport');
        socket.io.opts.transports = ['polling', 'websocket'];
    });

    socket.on('connect', () => console.log(TAG, 'Download socket connected'));

    socket.on('connect_error', () => console.error(TAG, 'Socket connection error'));
    socket.on('error', () => console.error(TAG, 'Socket authentication error'));

    socket.on('download', ({url}) => {
      if (pendingReqResolve !== null)
        pendingReqResolve(url);
    });

    return socket;
}

export function requestDownload(socket, songId, semitones, outputFormat, split) {
  const msg = {id: songId, semitones: semitones, output_format: outputFormat, split: split};
  socket.emit('modify_song', msg);
  return new Promise(resolve => pendingReqResolve = resolve);
}
