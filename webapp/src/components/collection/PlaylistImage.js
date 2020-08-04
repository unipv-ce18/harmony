import {classList} from '../../core/utils';
import {DEFAULT_ALBUMART_URL} from '../../assets/defaults';

import style from './PlaylistImage.scss';

const getDivStyle = images =>
  (images == null || images.length <= 1) ? style.singleimage :
    images.length === 2 && style.twoimages ||
    images.length === 3 && style.threeimages ||
    style.fourimages;

const PlaylistImage = ({images, size}) => (
  <div class={classList(style.divImage, getDivStyle(images))} style={size && {width: size, height: size}}>
    {images == null || images.length === 0
      ? <div><img src={DEFAULT_ALBUMART_URL} alt=""/></div>
      : images.map(item => <div><img src={item} alt=""/></div>)}
  </div>
);

export default PlaylistImage;
