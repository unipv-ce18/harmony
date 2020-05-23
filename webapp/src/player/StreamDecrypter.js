const EME_CONFIG = [{
  initDataTypes: ['webm'],
  audioCapabilities: [{
    contentType: 'audio/webm; codecs="vorbis"'
  }]
}];

/**
 * Converts Uint8Array to base64url without padding
 */
function toBase64u(u8arr) {
  return btoa(String.fromCharCode.apply(null, u8arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
}

/**
 * Converts base64url to an Uint8Array
 */
function fromBase64u(b64) {
  return new Uint8Array(atob(b64.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
}

export class StreamDecrypter {

  /** @type {string} */
  currentItemId = undefined;

  /** @type {MediaProvider} */
  #mediaProvider = null;

  constructor(mediaProvider, mediaElement) {
    this.#mediaProvider = mediaProvider;
    mediaElement.addEventListener('encrypted', this.#handleEncrypted.bind(this), false);
  }

  #obtainMediaKeys(mediaElement) {
    if (mediaElement.mediaKeys)
      return Promise.resolve(mediaElement.mediaKeys);

    return navigator.requestMediaKeySystemAccess('org.w3.clearkey', EME_CONFIG)
      .then(keySysAccess => keySysAccess.createMediaKeys())
      .then(mediaKeys => mediaElement.setMediaKeys(mediaKeys))
      .then(() => mediaElement.mediaKeys)
      .catch(error => console.error('Failed to set up MediaKeys', error));
  }

  #handleEncrypted(event) {
    this.#obtainMediaKeys(event.target).then(mediaKeys => {
      const session = mediaKeys.createSession();
      session.addEventListener('message', this.#handleEMEMessage.bind(this), false);
      session.generateRequest(event.initDataType, event.initData)
        .catch(error => console.error('Failed to generate a license request', error));
    });
  }

  #handleEMEMessage(event) {
    // Handle a message from the EME subsystem
    this.#obtainLicense(event.message).then(license => {
      event.target.update(license)  // event.target is the session
        .catch(error => console.error('Failed to update EME session', error));
    })
  }

  // TODO async await?
  // TODO may want to see if the KID matches the manifest first
  #obtainLicense(emeMessage) {
    const request = JSON.parse(new TextDecoder().decode(emeMessage));
    console.log('EME request', request);

    const fetchPromises = request.kids.map(kid =>
      this.#mediaProvider.fetchEncryptionKey(this.currentItemId, fromBase64u(kid)));

    return Promise.all(fetchPromises)
      .then(keys => keys.map((key, idx) => {
        return {kty: 'oct', alg: 'A128W', kid: request.kids[idx], k: toBase64u(key)};
      }))
      .then(keySpec => {
        const license = {keys: keySpec};
        console.log('EME response', license);
        return new TextEncoder().encode(JSON.stringify(license));
      });
  }

}
