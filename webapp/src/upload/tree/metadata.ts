// https://xiph.org/flac/format.html#metadata_block_header
type MetaHeader = {
  last: boolean,
  blockType: BlockType,
  dataOffset: number,
  dataLength: number
}

enum BlockType {
  STREAMINFO = 0,
  PADDING = 1,
  APPLICATION = 2,
  SEEKTABLE = 3,
  VORBIS_COMMENT = 4,
  CUESHEET = 5,
  PICTURE = 6
}

type PictureType = number;  // range [0, 20] - ID3v2 APIC

type TagName = 'ARTIST' | 'ALBUMARTIST' | 'ALBUM' | 'TITLE' | 'DATE';

export type SongTags = { [tag in TagName]?: string };
type SongPicture = { width: number, height: number, data: Blob, description: string, type: PictureType };

export type SongMetadata = {
  trackLength: number,  // in millis
  tags: SongTags,
  picture?: SongPicture
}

const bufToString = (b: ArrayBuffer, offset: number, len: number) =>
  String.fromCharCode.apply(null, new Uint8Array(b.slice(offset, offset + len)));

function checkIsFlacFile(b: Blob): Promise<void> {
  return b.slice(0, 4).text()
    .then(magic => {if (magic !== 'fLaC') throw new Error('Not a valid FLAC file')});
}

function getMetadataBlocks(b: Blob): Promise<MetaHeader[]> {
  const readBlockHeader = (offset: number) => b.slice(offset, offset + 4).arrayBuffer()
    .then(ab => new DataView(ab))
    .then(dv => ({
      last: (dv.getUint8(0) & 0x80) !== 0,
      blockType: (dv.getUint8(0) & 0x7f) as BlockType,
      dataOffset: offset + 4,
      dataLength: dv.getUint32(0, false) & 0x00ffffff
    }));

  const recurse: (offset: number) => Promise<MetaHeader[]> = offset => readBlockHeader(offset).then(
    meta => meta.last ? [meta] : recurse(meta.dataOffset + meta.dataLength).then(nextMeta => [meta, ...nextMeta])
  );
  return recurse(4);
}

function extractTrackLength(streamInfoBuf: ArrayBuffer): number {
  // https://xiph.org/flac/format.html#metadata_block_streaminfo
  const v = new DataView(streamInfoBuf);
  const scBundle = v.getUint32(10 - 1, false) & 0x00ffffff;
  const samplingRaw = scBundle >> 3;
  const channels = scBundle & 0x03;

  // BigInt -> Num safe since our number < 2^53
  const sampleCount = Number(v.getBigUint64(13 - 3, false)) & 0x0fffffffff;
  return Math.floor(sampleCount * channels / samplingRaw * 1000);
}

function extractTags(vorbisCommentBuf: ArrayBuffer): SongTags {
  // https://www.xiph.org/vorbis/doc/v-comment.html
  const v = new DataView(vorbisCommentBuf);
  let pos = 0;

  // Note: tag lengths are little-endian
  const vendorLen = v.getUint32(pos, true);
  //console.log('vendor:', bufToStr(4, vendorLen));
  pos += 4 + vendorLen;

  const commentListLen = v.getUint32(4 + vendorLen, true);
  pos += 4;

  const tags: SongTags = {};
  for (let i = 0; i < commentListLen; ++i) {
    const fieldLen = v.getUint32(pos, true);
    const [key, value, _] = bufToString(vorbisCommentBuf, pos + 4, fieldLen).split(/=(.*)/);
    tags[key.toUpperCase() as TagName] = value;
    pos += 4 + fieldLen;
  }

  console.assert(pos === vorbisCommentBuf.byteLength);
  return tags;
}

function extractPicture(pictureBuf: ArrayBuffer): SongPicture {
  const v = new DataView(pictureBuf);
  let pos = 0;

  const type = v.getUint32(pos, false);
  pos += 4;

  const mimeLen = v.getUint32(pos, false);
  const mime = bufToString(pictureBuf, pos + 4, mimeLen);
  pos += 4 + mimeLen;

  const descriptionLen = v.getUint32(pos, false);
  const description = bufToString(pictureBuf, pos + 4, descriptionLen);
  pos += 4 + descriptionLen;

  const width = v.getUint32(pos, false);
  const height = v.getUint32(pos + 4, false);
  //const colorDepth = v.getUint32(pos + 8, false);
  //const gifPaletteSize = v.getUint32(pos + 12, false);
  pos += 16;

  const pictureLen = v.getUint32(pos, false);
  const data = new Blob([pictureBuf.slice(pos + 4, pos + 4 + pictureLen)], {type: mime});

  return {data, description, width, height, type};
}

/**
 * Extracts metadata from a FLAC audio file blob
 * 
 * @param file - the blob from which metadata is to be extracted
 * @param skipPicture - an optional function that indicates whether to extract also the cover art from the file
 */
export function readFlacMetadata(file: Blob, skipPicture?: (tags: SongTags) => boolean): Promise<SongMetadata> {
  return checkIsFlacFile(file)
    .then(() => getMetadataBlocks(file))
    .then(metaBlocks => {
      const getBlockBuffer = (type: BlockType) => {
        const block = metaBlocks.find(b => b.blockType === type);
        return block != null
          ? file.slice(block.dataOffset, block.dataOffset + block.dataLength).arrayBuffer()
          : undefined;
      }

      return Promise.all([
        getBlockBuffer(BlockType.STREAMINFO)!.then(extractTrackLength),
        getBlockBuffer(BlockType.VORBIS_COMMENT)!.then(extractTags),
      ]).then(([trackLength, tags]) => {
        // If picture should be skipped return undefined
        return new Promise(r => r((skipPicture == null || !skipPicture(tags))
          ? getBlockBuffer(BlockType.PICTURE)?.then(extractPicture)
          : undefined
        )).then((picture: SongPicture) => ({trackLength, tags, picture}));
      })
    });
}
