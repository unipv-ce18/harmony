import {AdaptiveStream, MediaResource, StreamVariant} from './MediaResource';

export class MediaProvider {

  // (id, resource) map of items awaiting for response (v: Promise) or for transcoding completion (v: MediaResource)
  pendingMedia = {};

  // (id, Promise) for pending keys
  pendingKeys = {};

  fetchMedia(mediaId) {
    const dummyResult = new MediaResource(mediaId, 'audio', [
      new AdaptiveStream(0, 'audio', [
        new StreamVariant(320000).complete(['http://localhost:81/audio_out.webm'])
      ])
    ]);
    return Promise.resolve(dummyResult);
  }

  fetchFragmentKey(mediaId, keyId, streamId = 0, variantBitrate = 0) {
    const dummyResult = new Uint8Array([
      0xa4, 0x63, 0x1a, 0x15, 0x3a, 0x44, 0x3d, 0xf9,
      0xee, 0xd0, 0x59, 0x30, 0x43, 0xdb, 0x75, 0x19
    ]);
    return Promise.resolve(dummyResult);
  }

}
