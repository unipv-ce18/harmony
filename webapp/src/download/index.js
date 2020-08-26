import {createSocket} from '../core/ws';

let pendingReqResolve = null;

export function createDownloadSocket(accessToken) {
  const socket = createSocket(DOWNLOAD_SOCKET_URL, accessToken);

  socket.on('download', ({url}) => {
    if (pendingReqResolve !== null) {
      pendingReqResolve(url);
      pendingReqResolve = null;
    }
  });

  return socket;
}

export function requestDownload(socket, songId, semitones, outputFormat, split) {
  const msg = {id: songId, semitones: semitones, output_format: outputFormat, split: split};
  socket.emit('modify_song', msg);
  return new Promise(resolve => pendingReqResolve = resolve);
}
