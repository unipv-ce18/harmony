import {MediaResource, MediaResourceStream, MediaResourceVariant} from './MediaResource';

function parseResource(jsonRes: any): MediaResource {
  return new MediaResource(jsonRes.ent.id, jsonRes.ent.cat, jsonRes.duration, parseStreams(jsonRes.streams))
}

function parseStreams(jsonStreams: any) {
  return jsonStreams.map((s: any) => new MediaResourceStream(s.id, s.contentType, s.codec, parseVariants(s.variants)));
}

function parseVariants(jsonVariants: any) {
  return jsonVariants.map((v: any) => {
    switch (v.status) {
      case 'ready':
        return new MediaResourceVariant(v.bit_rate, v.sample_rate).complete(v.init, v.segments);
      case 'pending':
        return new MediaResourceVariant(v.bit_rate, v.sample_rate).updateProgress(v.progress);
      case 'unavailable':
        return new MediaResourceVariant(v.bit_rate, v.sample_rate);
      default:
        throw new Error(`Unknown variant status "${v.status}"`)
    }
  })
}

export class MediaProvider {

  // (id, resource) map of items awaiting for response (v: Promise) or for transcoding completion (v: MediaResource)
  pendingMedia = {};

  // (id, Promise) for pending keys
  pendingKeys = {};

  fetchMediaInfo(mediaId: string): Promise<MediaResource> {
    return Promise.resolve(parseResource(require('./sampleManifest')));
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

}
