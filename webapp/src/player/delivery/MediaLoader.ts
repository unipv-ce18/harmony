import {MediaResource, MediaResourceVariant} from './MediaResource';
import {MediaProvider} from './MediaProvider';
import {BufferManager} from '../buffer/BufferManager';

// TODO define this in a single place along with EME config
const MIME_TYPE = 'audio/webm; codecs="vorbis"';

function awaitFirstVariant(mediaRes: MediaResource): MediaResourceVariant {
    // In the future, this should return a promise when the first variant becomes ready after transcoding
    return mediaRes.streams[0].variants[0];
}

export class MediaLoader {

    private readonly mediaSource = new MediaSource();

    private bufferManager?: BufferManager;
    private onInfoFetchCallback?: (mediaRes: MediaResource) => void;
    private errorCallback?: (err: Error) => void;

    constructor(private readonly mediaProvider: MediaProvider,
                private readonly mediaElement: HTMLMediaElement,
                private mediaItemId: string) {
        const sourceURL = URL.createObjectURL(this.mediaSource);
        this.mediaSource.addEventListener('sourceopen', this.onSourceOpen.bind(this, sourceURL));
        this.mediaElement.src = sourceURL;
    }

    public onError(errorCallback: (err: Error) => void): this {
        this.errorCallback = errorCallback;
        if (this.bufferManager) this.bufferManager.errorHandler = errorCallback;
        return this;
    }

    public onInfoFetch(onInfoFetchCallback: (mediaRes: MediaResource) => void): this {
        this.onInfoFetchCallback = onInfoFetchCallback;
        return this;
    }

    private onSourceOpen(sourceURL: string, e: Event) {
        URL.revokeObjectURL(sourceURL);
        // TODO Use MIME type from stream
        this.bufferManager = new BufferManager(this.mediaElement, this.mediaSource.addSourceBuffer(MIME_TYPE));
        this.bufferManager.errorHandler = this.errorCallback;

        //sourceBuffer.addEventListener('updateend', e => {
        //  if (!sourceBuffer.updating && mediaSource.readyState === 'open') mediaSource.endOfStream();
        //});

        this.mediaProvider.fetchMediaInfo(this.mediaItemId)
            .then(mediaRes => {
                this.mediaSource.duration = mediaRes.duration!;
                if (this.onInfoFetchCallback) this.onInfoFetchCallback(mediaRes);
                return awaitFirstVariant(mediaRes);
            })
            .then(mediaVariant => this.bufferManager!.putVariant(0, mediaVariant))
            .catch(error => this.errorCallback && this.errorCallback(error));
    }

}
