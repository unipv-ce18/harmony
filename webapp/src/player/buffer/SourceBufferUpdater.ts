export type SegmentData = {u: string, t?: number, d?: number};

const TAG = '[Player.SourceBufferUpdater]';

/**
 * Maintains a queue of fetch and update operations to perform on a {@link SourceBuffer}
 */
export class SourceBufferUpdater<SegmentType extends SegmentData> {

    private readonly updateEndCallbacks: Array<(segmentData: SegmentType) => void> = [];
    private fetchQueue: Array<SegmentType> = [];
    private pendingFetchData?: SegmentType;

    /**
     * Creates a new updater instance
     * @param sourceBuffer - The source buffer to operate on
     * @param errorCallback - The function to call in case of errors
     */
    constructor(private readonly sourceBuffer: SourceBuffer,
                public errorCallback?: (err: Error) => void) {
        sourceBuffer.mode = 'sequence';
        sourceBuffer.addEventListener('updateend', this.onBufferUpdateEnd.bind(this));
    }

    /**
     * Enqueues the given segment for fetching and appending to the source buffer
     *
     * @param segmentData - Information about the segment
     * @param {string} segmentData.u - URL where the segment is to be fetched
     * @param {number} [segmentData.t] - Timestamp for the segment (or null for e.g. an initialization segment)
     */
    public enqueue(segmentData: SegmentType) {
        console.log(TAG, 'Enqueued', segmentData.u);
        if (this.pendingFetchData)
            this.fetchQueue.push(segmentData);
        else
            this.startFetch(segmentData);
    }

    /**
     * Adds a callback to be invoked when a segment update finishes
     *
     * @param updateEndCallback - The function to call
     */
    public addUpdateEndCallback(updateEndCallback: (segmentData: SegmentType) => void) {
        this.updateEndCallbacks.push(updateEndCallback);
    }

    /**
     * Removes callback previously registered through {@link addUpdateEndCallback}
     *
     * @param updateEndCallback - The function to remove from the callbacks list
     */
    public removeUpdateEndCallback(updateEndCallback: (segmentData: SegmentType) => void) {
        const idx = this.updateEndCallbacks.indexOf(updateEndCallback);
        if (idx > -1) this.updateEndCallbacks.splice(idx, 1);
    }

    /**
     * Clears the pending segments queue, the segment currently being fetched will finish regularly
     *
     * @return The canceled segments
     */
    public clearPending(): Array<SegmentType> {
        const queue = this.fetchQueue;
        this.fetchQueue = [];
        return queue;
    }

    private startFetch(segmentData: SegmentType) {
        this.pendingFetchData = segmentData;
        fetch(segmentData.u)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                console.log(TAG, 'Appending', segmentData.u);
                if (segmentData.t) this.sourceBuffer.timestampOffset = segmentData.t / 1000000;
                this.sourceBuffer.appendBuffer(arrayBuffer);
            })
            .catch(error => this.errorCallback && this.errorCallback(error));
    }

    private onBufferUpdateEnd(e: Event) {
        this.updateEndCallbacks.forEach(f => f(this.pendingFetchData!));

        const next = this.fetchQueue.shift();   // Either the next item or undefined
        if (next)
            this.startFetch(next);
        else
            this.pendingFetchData = undefined;
    }

}
