import {Component, createRef} from 'preact';
import PropTypes from 'prop-types'

import {classList} from '../../core/utils';

import style from './Carousel.scss';

/**
 * TODO: Document
 */
class Carousel extends Component {

  render(props, state, context) {
    return (
      <div class={style.carousel}/>
    )
  }

}

Carousel.Page = class extends Component {
  // TODO: Implement
}

/**
 * Navigator for a {@link Carousel}
 *
 * Displays buttons to be able to navigate between the passed in carousel pages.
 */
Carousel.Nav = class extends Component {

  static propTypes = {
    /** The {@link Carousel} to control. */
    carousel: PropTypes.func,
    /** Whenever the "hidden" CSS class should be applied */
    visible: PropTypes.bool
  }

  state = {
    selected: 0
  }

  pages = [];

  componentDidMount() {
    this.pages = this.props.carousel.current.props.children.map(c => c.props);
  }

  render({visible}, {selected}, context) {
    return (
      <ul class={classList(style.carouselNav, !visible && style.hidden)}>
        {this.pages.map((props, i) =>
          <NavElement {...props} enabled={i === selected} onClick={this.#onItemSelect.bind(this, i)}/>
        )}
      </ul>
    );
  }

  #onItemSelect(i) {
    this.setState({selected: i})
    // TODO: Notify linked carousel
  }

}

/**
 * Carousel navigator item
 */
class NavElement extends Component {

  static propTypes = {
    /** The name of the item to display */
    name: PropTypes.string,
    /** The icon element to display */
    icon: PropTypes.func,
    /** Click event handler */
    onClick: PropTypes.func,
    /** Whenever the item should display as enabled */
    enabled: PropTypes.bool
  }

  ref = createRef();
  innerWidth = null;

  componentDidMount() {
    // CSS doesn't support transitions to 'auto' values, so we calculate the full item width by ourselves
    this.ref.current.style.maxWidth = 'unset';
    this.innerWidth = this.ref.current.getBoundingClientRect().width;
    this.ref.current.style.maxWidth = null;
    this.forceUpdate();
  }

  render({name, icon: Icon, onClick, enabled}, state, context) {
    return (
      <li ref={this.ref} onClick={onClick} title={name}
          style={{maxWidth: enabled ? this.innerWidth : null}}
          class={classList(style.navItem, enabled && style.selected)}>
        <Icon/><span>{name}</span>
      </li>
    )
  }

}

export default Carousel;
