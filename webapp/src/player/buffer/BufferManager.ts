import {MediaResourceSegment, MediaResourceVariant} from '../delivery/MediaResource';
import {SegmentData, SourceBufferUpdater} from './SourceBufferUpdater';

const TAG = '[Player.BufferManager]';

// Nr. of forward segments to preload during playback
const SEGMENT_PREFETCH_COUNT = 3;

// Used in segment map to indicate segments for which a fetch is in progress (keep this below zero for priority scheme)
const SEGMENT_MAP_PENDING_FLAG = -1;

// Extension of SegmentData to hold tracking indices we need to update our mapping of the buffer
type ExtSegmentData = SegmentData & { varIdx?: number, segIdx?: number };

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

    private readonly bufferUpdater: SourceBufferUpdater<ExtSegmentData>;
    private readonly variants: Array<MediaResourceVariant> = [];

    private _currentVariantIndex?: number;
    private currentSegment?: number;
    private segmentMap?: Array<number | undefined>;

    /**
     * Creates a new {@link BufferManager} instance
     *
     * @param mediaElement - The DOM media element to listen for time update events
     * @param sourceBuffer - The source buffer where new segments should be appended
     */
    constructor(private readonly mediaElement: HTMLMediaElement, sourceBuffer: SourceBuffer) {
        this.mediaElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.bufferUpdater = new SourceBufferUpdater(sourceBuffer, this.onBufferUpdateEnd.bind(this));
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
        this.triggerBufferUpdate(this.mediaElement.currentTime * 1000000);
    }

    set errorHandler(value: ((err: Error) => void) | undefined) {
        this.bufferUpdater.errorCallback = value;
    }

    private findSegment(timestamp: number): number {
        const refSegments = this.variants[this._currentVariantIndex!].segments!;

        if (this.currentSegment) {
            // First assume the segment did not change
            if (timeInSegment(refSegments[this.currentSegment], timestamp))
                return this.currentSegment;

            // Try the next segment
            const nextSegment = refSegments[this.currentSegment + 1];
            if (nextSegment === undefined) // past last segment
                return -1;
            if (timeInSegment(nextSegment, timestamp))
                return this.currentSegment + 1;
        }

        // As a last resort, try them all (returns -1 if it fails)
        return refSegments.findIndex(s => timeInSegment(s, timestamp));
    }

    private triggerBufferUpdate(currentTimestamp: number) {
        const newSegment = this.findSegment(currentTimestamp);
        console.log(TAG, 'Trigger update', {ts: currentTimestamp, seg: newSegment});

        // If we haven't changed segment (or we reached the end), do nothing and return
        if (this.currentSegment === newSegment || newSegment === -1) return;

        // Update the current segment property and schedule new fetches to update the buffer
        this.currentSegment = newSegment;
        const fetchList: Array<ExtSegmentData> = [];

        const segSource = this.variants[this._currentVariantIndex!].segments!;
        const segMap = this.segmentMap!;
        for (let i = newSegment; i <= Math.min(newSegment + SEGMENT_PREFETCH_COUNT, segSource.length); ++i) {
            if (segMap[i] === undefined || segMap[i]! > this._currentVariantIndex!) {
                // Add variant and segment indices so we can update the map when the buffer has been updated
                fetchList.push({varIdx: this._currentVariantIndex, segIdx: i, ...segSource[i]});
                segMap[i] = SEGMENT_MAP_PENDING_FLAG;
            }
        }

        fetchList.forEach(s => this.bufferUpdater.enqueue(s));
    }

    private onTimeUpdate(event: {target: HTMLMediaElement}) {
        // Do nothing if the media element is paused (or seeking)
        if (event.target.paused) return;

        this.triggerBufferUpdate(event.target.currentTime * 1000000);
    }

    private onBufferUpdateEnd(segmentData: ExtSegmentData) {
        const buffered = this.mediaElement.buffered;
        for (let i = 0; i < buffered.length; ++i)
            console.log(TAG, 'Buffered', `#${i} ${buffered.start(i)}:${buffered.end(i)}`);

        if (segmentData.varIdx)  // Ensure not an init segment
            this.segmentMap![segmentData.segIdx!] = segmentData.varIdx;
    }

}
