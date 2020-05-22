import {MediaResourceSegment, MediaResourceVariant} from '../delivery/MediaResource';
import {SegmentData, SourceBufferUpdater} from './SourceBufferUpdater';

const TAG = '[Player.BufferManager]';

// Nr. of forward segments to preload during playback
const SEGMENT_PREFETCH_COUNT = 3;

// Used in segment map to indicate segments for which a fetch is in progress (keep this below zero for priority scheme)
const SEGMENT_MAP_PENDING_FLAG = -1;

// Extension of SegmentData to hold tracking indices we need to update our mapping of the buffer
type ExtSegmentData = SegmentData & { varIdx?: number, segIdx?: number };

export type ExhaustionCallbackParams = { endTimestamp: number };
type ExhaustionCallback = (params: ExhaustionCallbackParams) => void;
type EndedCallback = () => void;

function timeInSegment({t, d}: MediaResourceSegment, timestamp: number) {
    return timestamp >= t && timestamp < t + d;
}

/**
 * Listens for an {@link HTMLMediaElement} current location and fetches media segments from a
 * {@link MediaResourceVariant} into a {@link SourceBuffer} accordingly.
 *
 * The variant from which new segments are fetched can be changed by setting {@link currentVariantIndex}:
 * - Segments with an higher priority (i.e. whose variant has a lower index) already in the buffer are reused;
 * - Segments with a lower priority or missing segments are fetched from the specified variant.
 *
 * To keep things manageable, inconsistencies between segment timestamps are ignored; this can lead to small
 * fractions of missing audio if a switch to a different variant is made at the wrong time.
 */
export class BufferManager {

    private readonly variants: Array<MediaResourceVariant> = [];

    private _currentVariantIndex?: number;
    private currentSegment?: number;
    private segmentMap?: Array<number | undefined>;
    private exhaustionCallback?: ExhaustionCallback;
    private endedCallback?: EndedCallback;

    /**
     * Creates a new {@link BufferManager} instance
     *
     * @param mediaElement - The DOM media element to listen for time update events
     * @param bufferUpdater - The source buffer wrapper where new segments should be appended
     * @param timeOffset - The relative time from the start of the buffer to operate on
     */
    constructor(private readonly mediaElement: HTMLMediaElement,
                private readonly bufferUpdater: SourceBufferUpdater<ExtSegmentData>,
                private readonly timeOffset: number = 0) {
        this.onMediaEvent = this.onMediaEvent.bind(this);
        this.onBufferUpdateEnd = this.onBufferUpdateEnd.bind(this);
        // We want to trigger continuous buffer updates during playback...
        mediaElement.addEventListener('timeupdate', this.onMediaEvent);
        // ...and when the tag is buffering on lack of data (if currentTime was changed manually)
        mediaElement.addEventListener('waiting', this.onMediaEvent);
        this.bufferUpdater.addUpdateEndCallback(this.onBufferUpdateEnd);
    }

    /**
     * Adds a stream variant to this planner
     *
     * @param index - The index where the variant should be placed, lower indices take priority in selection
     * @param variant - The stream variant data
     */
    public putVariant(index: number, variant: MediaResourceVariant) {
        if (variant.status !== MediaResourceVariant.STATUS_READY)
            throw Error('The given variant is not ready');
        this.variants[index] = variant;

        console.log(TAG, 'Added variant', index, variant);

        // Initialize if this is the first variant we add
        if (this._currentVariantIndex === undefined) {
            this.segmentMap = new Array(variant.segments!.length);
            this.currentVariantIndex = index;
        }
    }

    /**
     * The currently selected variant index
     */
    get currentVariantIndex() {
        return this._currentVariantIndex;
    }

    set currentVariantIndex(value: number | undefined) {
        if (value === this._currentVariantIndex || value === undefined) return;
        this._currentVariantIndex = value;

        // Abort pending fetches
        for (let {segIdx} of this.bufferUpdater.clearPending())
            this.segmentMap![segIdx!] = undefined;

        // Put initialization segment and re-fetch the segments using the new variant
        this.bufferUpdater.enqueue({u: this.variants[value].initSegment!});
        this.triggerBufferUpdate(this.currentSegment || 0, true);
    }

    /**
     * Sets a callback to be called when the last segment of the media resource has been consumed and more segments
     * are needed to provide continuous playback of new media
     *
     * @param exhaustionCallback - The function to call, parameters given by {@link ExhaustionCallback}
     */
    public onResourceExhausted(exhaustionCallback: ExhaustionCallback): this {
        this.exhaustionCallback = exhaustionCallback;
        return this;
    }

    /**
     * Sets a callback to be called when the media current time reaches the end of the managed media resource
     *
     * The control is performed in the timeupdate event on the media, precision is not guaranteed.
     */
    public onResourceEnded(endedCallback: EndedCallback): this {
        console.log(TAG, 'Resource ended');
        this.endedCallback = endedCallback;
        return this;
    }

    /**
     * Prepares this instance for removal and stops listening for media element events
     */
    public detach() {
        this.mediaElement.removeEventListener('timeupdate', this.onMediaEvent);
        this.mediaElement.removeEventListener('waiting', this.onMediaEvent);
        this.bufferUpdater.removeUpdateEndCallback(this.onBufferUpdateEnd);
    }

    private findSegment(timestamp: number): number {
        const refSegments = this.variants[this._currentVariantIndex!].segments!;

        if (this.currentSegment !== undefined) {
            // First assume the segment did not change
            if (timeInSegment(refSegments[this.currentSegment], timestamp))
                return this.currentSegment;

            // Try the next segment (if we are not last)
            const notLast = this.currentSegment < refSegments.length - 1;
            if (notLast && timeInSegment(refSegments[this.currentSegment + 1], timestamp))
                return this.currentSegment + 1;
        }

        // If time is past last skip checking and return -1
        const lastSegment = refSegments[refSegments.length - 1];
        if (timestamp > lastSegment.t + lastSegment.d) return -1;

        // As a last resort, perform an exhaustive search (returns -1 if it fails)
        return refSegments.findIndex(s => timeInSegment(s, timestamp));
    }

    private triggerBufferUpdate(newSegment: number, force: boolean = false) {
        // If we haven't changed segment (or we reached the end), do nothing and return
        if (!force && (this.currentSegment === newSegment || newSegment === -1)) return;

        // Update the current segment property and schedule new fetches to update the buffer
        this.currentSegment = newSegment;
        const fetchList: Array<ExtSegmentData> = [];

        const segSource = this.variants[this._currentVariantIndex!].segments!;
        const segMap = this.segmentMap!;
        for (let i = newSegment; i < newSegment + SEGMENT_PREFETCH_COUNT; ++i) {
            if (i >= segSource.length) {  // We reached the last segment
                if (this.exhaustionCallback) {
                    console.log(TAG, 'Reaching end of resource');
                    this.exhaustionCallback({endTimestamp: this.getEndTime()!});
                }
                break;
            }

            if (segMap[i] === undefined || segMap[i]! > this._currentVariantIndex!) {
                // Add variant and segment indices so we can update the map when the buffer has been updated
                fetchList.push({
                    varIdx: this._currentVariantIndex, segIdx: i,
                    u: segSource[i].u, t: segSource[i].t + this.timeOffset
                });
                segMap[i] = SEGMENT_MAP_PENDING_FLAG;
            }
        }

        fetchList.forEach(s => this.bufferUpdater.enqueue(s));
    }

    private onMediaEvent(event: Event) {
        const absTimestamp = ((event.target as HTMLMediaElement).currentTime);

        const endTime = this.getEndTime();
        if (endTime !== undefined && this.endedCallback && absTimestamp >= endTime)
            this.endedCallback();

        const newSegment = this.findSegment(absTimestamp - this.timeOffset);
        //console.log(TAG, 'Trigger update', {ts: currentTimestamp, seg: this.currentSegment, nxSeg: newSegment});
        this.triggerBufferUpdate(newSegment);
    }

    private onBufferUpdateEnd(segmentData: ExtSegmentData) {
        const buffered = this.mediaElement.buffered;
        for (let i = 0; i < buffered.length; ++i)
            console.log(TAG, 'Buffered', `#${i} ${buffered.start(i)}:${buffered.end(i)}`);

        if (segmentData.varIdx !== undefined)  // Ensure not an init segment
            this.segmentMap![segmentData.segIdx!] = segmentData.varIdx;
    }

    private getEndTime(): number | undefined {
        if (this._currentVariantIndex === undefined) return undefined;
        return this.variants[this._currentVariantIndex].getTimeLength()! + this.timeOffset;
    }

}
