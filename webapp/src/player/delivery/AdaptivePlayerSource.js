// TODO define this in a single place along with EME config
const MIME_TYPE = 'audio/webm; codecs="vorbis"';

export class AdaptivePlayerSource {

  /** @type {MediaProvider} */
  #mediaProvider;

  /** @type {string} */
  #mediaItemId;

  /** @type {MediaSource} */
  #mediaSource;

  /** @type {string} */
  #sourceURL;

  /** @type {function} */
  #errorCallback;

  constructor(mediaProvider, mediaItemId) {
    this.#mediaProvider = mediaProvider;
    this.#mediaItemId = mediaItemId;

    this.#mediaSource = new MediaSource();
    this.#mediaSource.addEventListener('sourceopen', this.#onSourceOpen.bind(this));
  }

  get sourceURL() {
    if (!this.#sourceURL)
      this.#sourceURL = URL.createObjectURL(this.#mediaSource);
    return this.#sourceURL;
  }

  onError(errorCallback) {
    this.#errorCallback = errorCallback;
    return this;
  }

  #onSourceOpen(e) {
    if (this.#sourceURL) URL.revokeObjectURL(this.#sourceURL);

    const mediaSource = e.target;
    const sourceBuffer = mediaSource.addSourceBuffer(MIME_TYPE);
    sourceBuffer.addEventListener('updateend', e => {
      if (!sourceBuffer.updating && mediaSource.readyState === 'open') mediaSource.endOfStream();
    });
    sourceBuffer.addEventListener('abort', e => console.log('abort', e));
    sourceBuffer.addEventListener('error', e => console.log('error', e));

    this.#mediaProvider.fetchMedia(this.#mediaItemId)
      .then(mediaRes => this.#awaitInitialURL(mediaRes))
      .then(mediaUrl => fetch(mediaUrl))
      .then(response => response.arrayBuffer())
      .then(buffer => sourceBuffer.appendBuffer(buffer))
      .catch(error => this.#errorCallback && this.#errorCallback(error));

  }

  #awaitInitialURL(mediaRes) {
    return mediaRes.streams[0].variants[0].urls[0];
  }

}
