import {Component, createRef, Fragment} from 'preact';
import PropTypes from 'prop-types';

import PlayerEvents from '../PlayerEvents';
import {WAVEFORM_READY_EVENT} from '../plugins/WaveformLoaderPlugin';
import {PlayerViewContextConsumer} from './PlayerViewContext';

import style from './Seekbar.scss';


const CANVAS_PADDING = 4;
const BAR_COLOR_SOURCE_VAR = '--text-color';
const BAR_COUNT = 50;
const BAR_PAD = 1.5;
const BAR_BLUR = 5;
const BAR_OPACITY_EMPTY = 0.3;
const BAR_OPACITY_FILLED = 0.8;


class Seekbar extends Component {

  static propTypes = {
    /** Whether to show current and end time labels */
    showTime: PropTypes.bool
  }

  state = {
    curTimeLabel: null,
    endTimeLabel: null
  }

  #canvasRef = createRef();
  #inputRef = createRef();

  #renderContext = null;
  #fillColor = null;

  #resizeObserver = new ResizeObserver(els => {
    this.#setupCanvas();
    this.#renderCanvas();
  });

  #currentMediaId = null;  // ID of current track, to find out when it changes
  #waveData = null;

  constructor() {
    super();
    this.onSeekChange = this.onSeekChange.bind(this);
    this.onPlayerTimeUpdate = this.onPlayerTimeUpdate.bind(this);
    this.onWaveformReady = this.onWaveformReady.bind(this);
  }

  componentDidMount() {
    this.#resizeObserver.observe(this.#canvasRef.current);
    this.context.player.addEventListener(PlayerEvents.TIME_UPDATE, this.onPlayerTimeUpdate);
    this.context.player.addEventListener(WAVEFORM_READY_EVENT, this.onWaveformReady);

    this.#renderContext = this.#canvasRef.current.getContext('2d');
    this.#setupCanvas();
  }

  componentWillUnmount() {
    this.#resizeObserver.unobserve(this.#canvasRef.current);
    this.context.player.removeEventListener(PlayerEvents.TIME_UPDATE, this.onPlayerTimeUpdate);
    this.context.player.removeEventListener(WAVEFORM_READY_EVENT, this.onWaveformReady);
  }

  componentWillUpdate(nextProps, nextState, {currentMedia}) {
    if (currentMedia != null && currentMedia.mediaInfo.id !== this.#currentMediaId) {
      this.#currentMediaId = currentMedia.mediaInfo.id;
      this.#inputRef.current.max = currentMedia.length;
      this.#inputRef.current.value = 0;

      if (this.props.showTime)
        this.setState({endTimeLabel: formatLabel(currentMedia.length)});
    }

    const fillColor = getComputedStyle(this.#canvasRef.current).getPropertyValue(BAR_COLOR_SOURCE_VAR);
    if (fillColor !== this.#fillColor) {
      this.#fillColor = fillColor;
      this.#setupCanvas();
    }
  }

  render({showTime}, {curTimeLabel, endTimeLabel}) {
    const seekbar = (
      <div class={style.seekbar}>
        <canvas ref={this.#canvasRef}>No Canvas No Party</canvas>
        <input ref={this.#inputRef} type="range" onChange={this.onSeekChange}/>
      </div>
    );

    return showTime ? (
      <Fragment>
        <span>{curTimeLabel}</span>
        {seekbar}
        <span>{endTimeLabel}</span>
      </Fragment>
    ) : seekbar;
  }c

  onSeekChange(e) {
    this.context.player.seek(e.target.value);
    e.target.blur();  // Lose focus on input range to allow updates by onPlayerTimeUpdate
    this.#renderCanvas();
  }

  onPlayerTimeUpdate(e) {
    if (document.activeElement !== this.#inputRef.current) {
      this.#inputRef.current.value = e.detail.cur;
      this.#renderCanvas();
    }
    if (this.props.showTime)
      this.setState({curTimeLabel: formatLabel(e.detail.cur)});
  }

  onWaveformReady(e) {
    const {length, min, max} = this.context.player.currentWaveform;
    this.#waveData = {length, min: resample(min, BAR_COUNT, true), max: resample(max, BAR_COUNT, true)};
    this.#renderCanvas();
  }

  #setupCanvas() {
    const ctx = this.#renderContext;
    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;
    Object.assign(ctx, {
      shadowBlur: BAR_BLUR,
      shadowColor: `rgb(${this.#fillColor})`
    });
  }

  #renderCanvas() {
    if (this.#waveData === null) return;
    if (this.context.playerView.expanded === false) return;

    const ctx = this.#renderContext;

    const width = ctx.canvas.width - 2 * CANVAS_PADDING;
    const height = ctx.canvas.height - 2 * CANVAS_PADDING;

    const barWidth = (width - BAR_PAD) / BAR_COUNT;
    const seekX = this.#inputRef.current.value / this.#inputRef.current.max * width;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < BAR_COUNT; ++i) {
      const barX = BAR_PAD + i * barWidth;
      const barY = height / 2 * (1 - this.#waveData.max[i]);
      const barH = height / 2 * (this.#waveData.max[i] - this.#waveData.min[i]);

      const fillAmount = Math.max(Math.min(seekX - barX, barWidth), 0) / barWidth;
      const alpha = BAR_OPACITY_EMPTY + (BAR_OPACITY_FILLED - BAR_OPACITY_EMPTY) * fillAmount;
      ctx.fillStyle = `rgba(${this.#fillColor},${alpha})`;

      const realBarWidth = barWidth - BAR_PAD;  // w/o padding
      roundRect(ctx, CANVAS_PADDING + barX, CANVAS_PADDING + barY, realBarWidth, barH, realBarWidth / 2);
    }
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

function roundRect(ctx, x, y, w, h, r) {
  const h2 = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + Math.min(r, h2));
  ctx.lineTo(x + w, y + Math.max(h - r, h2));
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + Math.max(h - r, h2));
  ctx.lineTo(x, y + Math.min(r, h2));
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function formatLabel(secs) {
  secs = Math.floor(secs);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs - 3600 * h) / 60);
  const s = secs - 3600 * h - 60 * m;

  let ret = '';
  if (h > 0) ret += (h < 10 ? ('0' + h) : h) + '.';
  ret += ((h > 0 && m < 10) ? ('0' + m) : m) + '.';
  ret += (s < 10 ? ('0' + s) : s);
  return ret;
}

/**
 * Trivial resampling function for waveform data
 *
 * In short - this "converts" an N sized array of waveform samples into an `outSize` array having the same shape.
 *
 * This algorithm aims to be fast and works by applying weighted averages over input data,
 * to be accurate we would need to go with FIR filters like MATLAB/scipy `resample()`.
 *
 * @param {number[]} input - The input signal to convert
 * @param {number} outSize - The desired number of samples
 * @param {boolean} normalize - Whether to normalize the data (i.e. convert into a [0,1] range
 * @return {number[]} The new signal array of size `outSize`
 */
function resample(input, outSize, normalize = false) {
  const output = new Array(outSize);
  const ieNom = 1 / input.length;
  const oeNom = 1 / output.length;

  let ii = 0, ie = ieNom;
  let max = 1e-6;

  for (let oi = 0; oi < output.length; ++oi) {
    let slotVal = 0, oe = oeNom;

    while (oe > 1e-6) {
      let transE = Math.min(ie, oe);
      //console.log(input[ii] / ieNom, transE);
      slotVal += input[ii] / oeNom * transE;
      oe -= transE;
      ie -= transE;

      if (ie <= 1e-6) {
        ii++;
        ie = ieNom;
      }
    }

    //console.log('---');
    max = Math.max(max, Math.abs(slotVal));
    output[oi] = slotVal;
  }

  if (normalize) {
    for (let i = 0; i < output.length; ++i)
      output[i] /= max;
  }

  return output;
}

export default Seekbar;
