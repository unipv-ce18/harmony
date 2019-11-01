export class StreamVariant {
  static STATUS_UNAVAILABLE = 0;
  static STATUS_PENDING = 0;
  static STATUS_READY = 0;

  bitrate;
  status = StreamVariant.STATUS_UNAVAILABLE;
  progress = 0;
  urls = null;

  constructor(bitrate) {
    this.bitrate = bitrate;
  }

  updateProgress(progress) {
    this.status = StreamVariant.STATUS_PENDING;
    this.progress = progress;
  }

  complete(urls) {
    this.status = StreamVariant.STATUS_READY;
    this.urls = urls;
    return this;
  }
}

export class AdaptiveStream {
  id;
  type;
  variants;

  constructor(id, type, variants) {
    this.id = id;
    this.type = type;
    this.variants = variants;
  }
}

export class MediaResource {
  id;
  category;
  streams;

  constructor(id, category, streams) {
    this.id = id;
    this.category = category;
    this.streams = streams;
  }
}
