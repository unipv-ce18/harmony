import {Session} from '../../core/Session';
import {createSocket} from '../../core/ws';

type ErrorResponse = { id: string, error_code: number };
type ManifestResponse = { id: string, manifest_url: string };
type MediaKeyResponse = { id: string, key: string };
type CountSongResponse = { id: string };

export class SocketConnection {

    private socket?: SocketIOClient.Socket;

    // Use same collection ignoring the message type, for now
    private readonly pendingRequests = new Map<string, { resolve: Function, reject: Function }>();

    constructor(private readonly socketUrl: string,
                private readonly sessionManager: Session) {
    }

    fetchManifestUrl(songId: string): Promise<string> {
        return this.sendRequest('play_song', {id: songId});
    }

    fetchMediaKey(songId: string, keyId: string): Promise<string> {
        return this.sendRequest('get_key', {id: songId, kid: keyId});
    }

    sendScrobble(songId: string): Promise<void> {
      return this.sendRequest('count_song', {id: songId});
    }

    private getSocket(): Promise<SocketIOClient.Socket> {
        if (this.socket) {
            return Promise.resolve(this.socket);
        } else {
            return this.sessionManager.getAccessToken().then(token => {
                this.socket = createSocket(this.socketUrl, token!);
                this.socket.on('manifest', this.handleManifestResponse.bind(this));
                this.socket.on('media_key', this.handleMediaKeyResponse.bind(this));
                this.socket.on('count_song_ack', this.handleCountSongResponse.bind(this));
                this.socket.on('md_error', this.handleErrorResponse.bind(this));
                return this.socket;
            });
        }
    }

    private sendRequest<B extends { id: string }, T>(type: string, body: B): Promise<T> {
        return new Promise((resolve, reject) => {
            this.pendingRequests.get(body.id)?.reject();  // Cancel already running pending requests

            this.pendingRequests.set(body.id, {resolve, reject});
            this.getSocket().then(socket => socket.emit(type, body));
        })
    }

    private handleManifestResponse(m: ManifestResponse) {
        this.pendingRequests.get(m.id)?.resolve(m.manifest_url);
        this.pendingRequests.delete(m.id);
    }

    private handleMediaKeyResponse(m: MediaKeyResponse) {
        this.pendingRequests.get(m.id)?.resolve(m.key);
        this.pendingRequests.delete(m.id);
    }

    private handleCountSongResponse(m: CountSongResponse) {
      this.pendingRequests.get(m.id)?.resolve();
      this.pendingRequests.delete(m.id);
    }

    private handleErrorResponse(m: ErrorResponse) {
        this.pendingRequests.get(m.id)?.reject(m.id);
        this.pendingRequests.delete(m.id);
    }

}
