import {Component} from 'preact';

import styles from './PlaylistImage.scss';
import emptyImage from './image.jpg';
import {classList} from '../../core/utils';

class PlaylistImage extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const images = this.props.images;
    const size = this.props.size;
    let divStyle;
    if (images.length === 2) divStyle = styles.twoimages;
    else if (images.length === 3) divStyle = styles.threeimages;
    else if (images.length >= 4) divStyle = styles.fourimages;
    else divStyle = styles.singleimage;

    return (
      <div className ={classList(styles.divImage, divStyle)} style={size && {width: size, height: size}}>
        {images.length === 0 ? <div><img src={emptyImage} alt={""}/></div> :
          images.map(item => {return <div><img src={item} alt={""}/></div>})}
      </div>);
  }
}

export default PlaylistImage;
