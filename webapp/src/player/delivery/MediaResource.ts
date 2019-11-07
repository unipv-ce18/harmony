type MediaResourceSegment = { t: number, d: number, u: string };

export class MediaResource {

    constructor(
        public readonly id: string,
        public readonly category: string = 'music',
        public readonly streams: Array<MediaResourceStream> = []) {
    }

}

export class MediaResourceStream {

    constructor(
        public readonly id: number,
        public readonly type: string = 'audio',
        public readonly variants: Array<MediaResourceVariant> = []
    ) {
    }

}

export class MediaResourceVariant {

    static STATUS_UNAVAILABLE = 0;
    static STATUS_PENDING = 1;
    static STATUS_READY = 2;

    public status: number = MediaResourceVariant.STATUS_UNAVAILABLE;
    public progress?: number;
    public initSegment?: string;
    public segments?: Array<MediaResourceSegment>;

    constructor(
        public readonly bitrate: number,
        public readonly codec?: string,
        public readonly sampleRate?: number,
        public readonly duration?: number
    ) {
    }

    updateProgress(progress: number) {
        this.status = MediaResourceVariant.STATUS_PENDING;
        this.progress = progress;
    }

    complete(initSegment: string, segments: Array<MediaResourceSegment>): this {
        this.status = MediaResourceVariant.STATUS_READY;
        this.initSegment = initSegment;
        this.segments = segments;
        return this;
    }

}
