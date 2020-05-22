import io from 'socket.io-client'

type ErrorResponse = { id: string, error_code: number };
type ManifestResponse = { id: string, manifest_url: number };

const TAG = '[Player.SocketConnection]';

function createSocket(socketUrl: string, accessToken: string) {
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

export class SocketConnection {

    private readonly socket: SocketIOClient.Socket;
    private readonly pendingRequests = new Map<string, { resolve: Function, reject: Function }>();

    constructor(socketUrl: string, accessToken: string) {
        this.socket = createSocket(socketUrl, accessToken);
        this.socket.on('manifest', this.handleManifestResponse.bind(this));
        this.socket.on('md_error', this.handleErrorResponse.bind(this));
    }

    fetchManifestUrl(songId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.pendingRequests.get(songId)?.reject();  // Cancel already running pending requests

            this.pendingRequests.set(songId, {resolve, reject});
            this.socket.emit('play_song', {id: songId});
        })
    }

    private handleManifestResponse(m: ManifestResponse) {
        this.pendingRequests.get(m.id)?.resolve(m.manifest_url);
        this.pendingRequests.delete(m.id);
    }

    private handleErrorResponse(m: ErrorResponse) {
        this.pendingRequests.get(m.id)?.reject(m.id);
        this.pendingRequests.delete(m.id);
    }

}
