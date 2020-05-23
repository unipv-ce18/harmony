import {MediaResource} from './MediaResource';
import {SocketConnection} from './SocketConnection';
import {parseMediaManifest} from './manifestParser';

declare var PLAYER_SOCKET_URL: string


function toHexString(byteArray: Uint8Array): string {
    return Array.from(byteArray,
        byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)
    ).join('')
}

function fromHexString(hexStr: string): Uint8Array {
    return new Uint8Array(hexStr.match(/.{2}/g)!.map(b => parseInt(b, 16)))
}

function getMediaFileBaseUrl(manifestUrl: string) {
    return manifestUrl.substr(0, manifestUrl.lastIndexOf('/') + 1)
}

export class MediaProvider {

    private readonly socketConnection: SocketConnection

    constructor(accessToken: string) {
        this.socketConnection = new SocketConnection(PLAYER_SOCKET_URL, accessToken);
    }

    fetchMediaInfo(mediaId: string): Promise<MediaResource> {
        return this.socketConnection.fetchManifestUrl(mediaId)
            .then(mpdUrl =>
                fetch(mpdUrl)
                    .then(response => {
                        if (!response.ok) throw new Error(`Error while fetching "${mpdUrl}"`)
                        return response.text();
                    })
                    .then(mpdText => {
                        return new DOMParser().parseFromString(mpdText, 'text/xml');
                    })
                    .then(mpdXml => parseMediaManifest(mpdXml, mediaId, getMediaFileBaseUrl(mpdUrl)))
            )
    }

    fetchEncryptionKey(mediaId: string, keyId: Uint8Array): Promise<Uint8Array> {
        return this.socketConnection.fetchMediaKey(mediaId, toHexString(keyId))
            .then(key => fromHexString(key))
    }

}
