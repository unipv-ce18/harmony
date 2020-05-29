import {Component, createRef} from 'preact';
import PropTypes from 'prop-types';

import {classList} from '../../core/utils';

import style from './SelectorMenu.scss';

/**
 * A selection menu
 *
 * Once an item is selected, the passed in callback function is invoked with its ID.
 */
class SelectorMenu extends Component {

  static propTypes = {
    /** Array of items to display */
    items: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.stringicon,
      icon: PropTypes.elementType
    }),
    /** Function to be called when an item is selected, with its ID as a parameter */
    onSelection: PropTypes.func,
    /** Whenever the "hidden" CSS class should be applied */
    visible: PropTypes.bool
  }

  state = {selected: 0}

  render({items, visible}, {selected}) {
    return (
      <ul class={classList(style.carouselNav, !visible && style.hidden)}>
        {items.map((item, i) =>
          <MenuButton {...item} enabled={i === selected} onClick={this.#onItemSelect.bind(this, i)}/>
        )}
      </ul>
    )
  }

  #onItemSelect(i) {
    this.setState({selected: i});
    this.props.onSelection(this.props.items[i].id);
  }

}

/**
 * Buttons used inside {@link SelectorMenu}
 */
class MenuButton extends Component {

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

  render({name, icon: Icon, onClick, enabled}) {
    return (
      <li ref={this.ref} onClick={onClick} title={name}
          style={{maxWidth: enabled ? this.innerWidth : null}}
          class={classList(style.navItem, enabled && style.selected)}>
        <Icon/><span>{name}</span>
      </li>
    )
  }

}

export default SelectorMenu;
