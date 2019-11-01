const EME_CONFIG = [{
  initDataTypes: ['webm'],
  audioCapabilities: [{
    contentType: 'audio/webm; codecs="vorbis"'
  }]
}];

// Converts Uint8Array to base64url without no padding
function toBase64(u8arr) {
  return btoa(String.fromCharCode.apply(null, u8arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
}

export class StreamDecrypter {

  /** @type {string} */
  currentItemId = undefined;

  /** @type {MediaProvider} */
  #mediaProvider = null;

  constructor(mediaProvider) {
    this.#mediaProvider = mediaProvider;
  }

  attach(element) {
    element.addEventListener('encrypted', this.#handleEncrypted.bind(this), false);
    navigator.requestMediaKeySystemAccess('org.w3.clearkey', EME_CONFIG)
      .then(keySysAccess => keySysAccess.createMediaKeys())
      .then(mediaKeys => element.setMediaKeys(mediaKeys))
      .catch(error => console.error('Failed to set up MediaKeys', error));
  }

  #handleEncrypted(event) {
    // TODO ensure event.target is media element
    const session = event.target.mediaKeys.createSession();
    session.addEventListener('message', this.#handleEMEMessage.bind(this), false);
    session.generateRequest(event.initDataType, event.initData)
      .catch(error => console.error('Failed to generate a license request', error));
  }

  #handleEMEMessage(event) {
    // Handle a message from the EME subsystem
    this.#obtainLicense(event.message).then(license => {
      event.target.update(license)  // event.target is the session
        .catch(error => console.error('Failed to update EME session', error));
    })
  }

  // TODO async await?
  #obtainLicense(emeMessage) {
    const request = JSON.parse(new TextDecoder().decode(emeMessage));

    // TODO: handle requests with multiple KIDs
    console.assert(request.kids.length === 1);

    return this.#mediaProvider.fetchFragmentKey(this.currentItemId, request.kids[0]).then(key => {
      const keyObj = {kty: 'oct', alg: 'A128W', kid: request.kids[0], k: toBase64(key)};
      return new TextEncoder().encode(JSON.stringify({keys: [keyObj]}));
    });
  }

}
