import {Component, createRef} from 'preact';
import {TransitionGroup} from 'preact-transition-group/src/TransitionGroup';
import PropTypes from 'prop-types';

import {createPalette, COLOR_BACKGROUND} from './colorPalette';
import {PlayerViewContextConsumer} from './PlayerViewContext';
import {MediaItemInfo} from '../MediaPlayer';

import style from './PlayerBackground.scss';

class PlayerBackground extends Component {

  #transGroup = createRef();

  static propTypes = {
    /** Called when a new color palette is generated */
    onColorPalette: PropTypes.func
  }

  state = {
    bgColor: null
  }

  lastImageUrl = null;

  componentDidUpdate(previousProps, previousState, snapshot) {
    const imageUrl = this.#getCover();
    if (imageUrl === this.lastImageUrl) return;

    const image = this.#transGroup.current.refs[imageUrl];
    if (!image) return;  // No current image

    createPalette(image.base).then(palette => {
      this.setState({bgColor: `rgb(${palette[COLOR_BACKGROUND]})`})
      this.props.onColorPalette && this.props.onColorPalette(palette);
    });

    this.lastImageUrl = imageUrl;
  }

  render(props, {bgColor}) {
    const coverUrl = this.#getCover();
    return (
      <TransitionGroup ref={this.#transGroup} class={style.frame} style={bgColor && {backgroundColor: bgColor}}>
        {coverUrl && <BackgroundImage key={coverUrl} src={coverUrl}/>}
      </TransitionGroup>
    );
  }

  #getCover() {
    return this.context.currentMedia && this.context.currentMedia.mediaInfo.tags[MediaItemInfo.TAG_ALBUMART_URL];
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

class BackgroundImage extends Component {

  render({src}) {
    return (
      <img src={src} alt="" crossOrigin="anonymous" className={style.background}/>
    );
  }

}

export default PlayerBackground;
