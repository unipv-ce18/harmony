import {MediaResource, MediaResourceVariant} from './delivery/MediaResource';
import {MediaProvider} from './delivery/MediaProvider';
import {BufferManager, ExhaustionCallbackParams} from './buffer/BufferManager';
import {SourceBufferUpdater} from "./buffer/SourceBufferUpdater";

// TODO define this in a single place along with EME config
const MIME_TYPE = 'audio/webm; codecs="vorbis"';

function awaitFirstVariant(mediaRes: MediaResource): MediaResourceVariant {
    // In the future, this should return a promise when the first variant becomes ready after transcoding
    return mediaRes.streams[0].variants[0];
}

type NextMediaData = {res: MediaResource, startTime: number}

/**
 * Obtains media information from a {@link MediaProvider} and coordinates {@link BufferManager}(s)
 * to allow (continuous) playback over a given {@link HTMLMediaElement} using the browser {@link MediaSource} API.
 */
export class MediaLoader {

    private readonly mediaSource = new MediaSource();

    private sourceBufferWrapper?: SourceBufferUpdater<any>;
    private currentBufferManager?: BufferManager;
    private nextBufferManager?: BufferManager;
    private nextMediaData?: NextMediaData;
    private onMediaResourceCallback?: (mediaRes: MediaResource) => void;
    private errorCallback?: (err: Error) => void;

    /**
     * Creates a new  {@link MediaLoader} instance
     *
     * @param mediaProvider - The {@link MediaProvider} used to obtain media manifests
     * @param mediaElement - The `<audio>` or `<video>` tag to configure
     * @param mediaItemId - The ID of the element to fetch from `mediaProvider`
     * @param nextItemProvider - A function returning more media to prefetch when the current one is being finished
     */
    constructor(private readonly mediaProvider: MediaProvider,
                private readonly mediaElement: HTMLMediaElement,
                mediaItemId: string,
                private nextItemProvider?: () => string) {
        this.onResourceEnding = this.onResourceEnding.bind(this);
        this.onResourceEnded = this.onResourceEnded.bind(this);

        const sourceURL = URL.createObjectURL(this.mediaSource);
        this.mediaSource.addEventListener('sourceopen', this.onSourceOpen.bind(this, sourceURL, mediaItemId));
        this.mediaElement.src = sourceURL;
    }

    /**
     * Sets a callback to be called in case of errors while fetching data
     *
     * @param errorCallback - The function to call when errors occur
     */
    public onError(errorCallback: (err: Error) => void): this {
        this.errorCallback = errorCallback;
        if (this.sourceBufferWrapper) this.sourceBufferWrapper.errorCallback = errorCallback;
        return this;
    }

    /**
     * Sets a function to call when new media is to be played
     *
     * @param onInfoFetchCallback - The function to call on new media,
     *                              the fetched {@link MediaResource} is passed as an argument
     */
    public onMediaResource(onInfoFetchCallback: (mediaRes: MediaResource) => void): this {
        this.onMediaResourceCallback = onInfoFetchCallback;
        return this;
    }

    private onSourceOpen(sourceURL: string, mediaId: string, e: Event) {
        URL.revokeObjectURL(sourceURL);
        // TODO Use MIME type from stream
        this.sourceBufferWrapper = new SourceBufferUpdater(this.mediaSource.addSourceBuffer(MIME_TYPE));
        this.sourceBufferWrapper.errorCallback = this.errorCallback;

        this.currentBufferManager = new BufferManager(this.mediaElement, this.sourceBufferWrapper)
            .onResourceExhausted(this.onResourceEnding)
            .onResourceEnded(this.onResourceEnded);

        //sourceBuffer.addEventListener('updateend', e => {
        //  if (!sourceBuffer.updating && mediaSource.readyState === 'open') mediaSource.endOfStream();
        //});

        this.mediaProvider.fetchMediaInfo(mediaId)
            .then(mediaRes => {
                this.mediaSource.duration = mediaRes.duration!;
                if (this.onMediaResourceCallback) this.onMediaResourceCallback(mediaRes);
                return awaitFirstVariant(mediaRes);
            })
            .then(mediaVariant => this.currentBufferManager!.putVariant(0, mediaVariant))
            .catch(error => this.errorCallback && this.errorCallback(error));
    }

    private onResourceEnding({endTimestamp}: ExhaustionCallbackParams) {
        // IF we were already called keep the already configured buffer manager
        if (this.nextBufferManager !== undefined) return;

        const nextMediaId = this.nextItemProvider && this.nextItemProvider();
        if (nextMediaId) {
            this.nextBufferManager = new BufferManager(this.mediaElement, this.sourceBufferWrapper!, endTimestamp)
                .onResourceExhausted(this.onResourceEnding)
                .onResourceEnded(this.onResourceEnded);

            this.mediaProvider.fetchMediaInfo(nextMediaId)
                .then(mediaRes => {
                    this.nextMediaData = {res: mediaRes, startTime: endTimestamp};
                    return awaitFirstVariant(mediaRes);
                })
                .then(mediaVariant => this.nextBufferManager!.putVariant(0, mediaVariant))
                .catch(error => this.errorCallback && this.errorCallback((error)));

        }
    }

    private onResourceEnded() {
        // Signaled by the current buffer manager when playback has gone past its end:
        // clean it up, set new buffer manager as current, signal media change.
        this.currentBufferManager!.detach();
        this.currentBufferManager = this.nextBufferManager;
        this.nextBufferManager = undefined;

        this.mediaSource.duration = this.nextMediaData!.res.duration! + this.nextMediaData!.startTime / 1000000;
        if (this.onMediaResourceCallback) this.onMediaResourceCallback(this.nextMediaData!.res);
        this.nextMediaData = undefined;
    }

}
