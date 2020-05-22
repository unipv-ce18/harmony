import {MediaResource} from './MediaResource';
import {SocketConnection} from './SocketConnection';
import {parseMediaManifest} from './manifestParser';

declare var PLAYER_SOCKET_URL: string


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
                    .then(mpdXml => parseMediaManifest(mpdXml, mediaId, MediaProvider.getMediaFileBaseUrl(mpdUrl)))
            )
    }

  fetchEncryptionKey(mediaId: string, keyId: string, streamId = 0, variantBitrate = 0) {
    switch (keyId) {
      case "RTmtOP51i9RctmhUhx10Jg":
        return Promise.resolve(new Uint8Array([
          0x36, 0xcc, 0xd6, 0xaf, 0xd0, 0x76, 0x71, 0xdd,
          0xbf, 0x63, 0x58, 0x49, 0x90, 0x9e, 0x91, 0x4f
        ]));
      case "88XgNh5mVLKPgEnHeLI5Rg":
        return Promise.resolve(new Uint8Array([
          0xa4, 0x63, 0x1a, 0x15, 0x3a, 0x44, 0x3d, 0xf9,
          0xee, 0xd0, 0x59, 0x30, 0x43, 0xdb, 0x75, 0x19
        ]));
    }
  }

    private static getMediaFileBaseUrl(manifestUrl: string) {
        return manifestUrl.substr(0, manifestUrl.lastIndexOf('/') + 1)
    }

}
