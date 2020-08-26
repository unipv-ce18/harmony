import io from "socket.io-client";

const TAG = '[Core.WS]';

export function createSocket(socketUrl: string, accessToken: string) {
    const socket = io(socketUrl, {
        transports: ['websocket'],
        query: {access_token: accessToken}
    });

    // On reconnection, fall back to polling
    socket.on('reconnect_attempt', () => {
        console.warn(TAG, 'Attempting reconnect with polling transport');
        this.socket.io.opts.transports = ['polling', 'websocket'];
    });

    socket.on('connect', () => console.log(TAG, 'Player socket connected'));

    // TODO: Handle these exceptions properly
    socket.on('connect_error', () => console.error(TAG, 'Socket connection error'));
    socket.on('error', () => console.error(TAG, 'Socket authentication error'));

    return socket;
}
