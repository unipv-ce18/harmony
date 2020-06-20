import {Component, createRef} from 'preact';
import TransitionGroup from 'preact-transition-group';
import PropTypes from 'prop-types';

import {fadeIn, fadeOut} from './animations';

import style from './IconButton.scss';


const BUTTON_ANIMATION_TIME_MS = 100;

/**
 * A fancy button with an icon inside!
 */
class IconButton extends Component {

  static propTypes = {
    /** The name of the button */
    name: PropTypes.string,
    /** The size of the button */
    size: PropTypes.number,
    /** The icon component to put inside the button */
    icon: PropTypes.elementType,
    /** The click event handler */
    onClick: PropTypes.func
  }

  render({name, size, icon: Icon, onClick}) {
    return (
      <TransitionGroup class={style.iconButton} title={name} style={size && {width: size, height: size}} onClick={onClick}>
        <AnimSwitcher key={Icon.name}><Icon/></AnimSwitcher>
      </TransitionGroup>
    );
  }

}

/**
 *  Captures {@link TransitionGroup} events to animate between button icons
 */
class AnimSwitcher extends Component {

  childRef = createRef();

  componentWillEnter(done) {
    fadeIn(this.childRef.current.base, null, BUTTON_ANIMATION_TIME_MS).onfinish = done;
  }

  componentWillLeave(done) {
    fadeOut(this.childRef.current.base, null, BUTTON_ANIMATION_TIME_MS).onfinish = done;
  }

  render({children}) {
    children.ref = this.childRef;
    return children;
  }

}

export default IconButton;
