import PlayerEvents from '../PlayerEvents';

export const WAVEFORM_READY_EVENT = 'waveformready';
const WAVEFORM_FILE = 'waveform.dat';

/**
 * Loads audiowaveform data on track change and makes it available at `player.currentWaveform`
 */
class WaveformLoaderPlugin {

  constructor() {
    this.onNewMedia = this.onNewMedia.bind(this);
  }

  bindPlayerPlugin(player) {
    player.addEventListener(PlayerEvents.NEW_MEDIA, this.onNewMedia);
  }

  unbindPlayerPlugin(player) {
    player.removeEventListener(PlayerEvents.NEW_MEDIA, this.onNewMedia);
  }

  onNewMedia(e) {
    fetch(e.detail.res.baseDataUrl + WAVEFORM_FILE)
      .then(response => response.arrayBuffer())
      .then(buf => parseWaveform(buf))
      .then(wf => {
        e.target.currentWaveform = wf
        e.target.dispatchEvent(new CustomEvent(WAVEFORM_READY_EVENT, {detail: {}}));
      });
  }

}

/**
 * Parses binary audiowaveform data
 *
 * @see https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md
 * @param {ArrayBuffer} data - waveform data to read
 * @return {{min: Int8Array, max: Int8Array, length: number}} waveform minimums, maximums and sample count
 */
function parseWaveform(data) {
  const v = new DataView(data);

  if (v.getInt32(0, true) !== 1)
    throw new Error('Not a version 1 audiowaveform file');

  const flags = v.getUint32(4, true);
  const sampleRate = v.getInt32(8, true);
  const samplePerPx = v.getInt32(12, true);
  const length = v.getUint32(16, true);
  //console.log(`flags: ${flags}, rate: ${sampleRate}, spp: ${samplePerPx}, length: ${length}`)

  if (flags !== 1)
    throw new Error('Not an 8bit resolution waveform');

  if ((data.byteLength - 20) / 2 !== length)
    throw new Error('Waveform sample count does not match announced length');

  const min = new Int8Array(length);
  const max = new Int8Array(length);

  for (let i = 0; i < length; ++i) {
    const idx = 20 + 2 * i;
    min[i] = v.getInt8(idx);
    max[i] = v.getInt8(idx + 1);
  }

  return {min, max, length};
}

export default WaveformLoaderPlugin;
