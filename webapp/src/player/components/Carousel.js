import {cloneElement, Component, createRef} from 'preact';
import TransitionGroup from 'preact-transition-group';
import PropTypes from 'prop-types'

import style from './Carousel.scss';

/**
 * A stateless multi-page carousel, selection is made over the key iof its children
 */
class Carousel extends Component {

  static propTypes = {
    /** List of pages that can be shown, selection is based on their `key` attribute */
    children: PropTypes.arrayOf(PropTypes.node),
    /** The currently selected node key */
    selected: PropTypes.string
  }

  render({children, selected}) {
    const currentPage = children.find(c => c.key === selected);
    return (
      <TransitionGroup class={style.carousel}>
        <Carousel.Page key={currentPage.key}>{currentPage}</Carousel.Page>
      </TransitionGroup>
    )
  }

}

/**
 * A page in the carousel, primarily handles visual transitions between pages
 */
Carousel.Page = class extends Component {

  static propTypes = {
    /** The page's content */
    children: PropTypes.node
  }

  itemRef = createRef();

  constructor(props, context) {
    super(props, context);
    props.children.ref = this.itemRef;
  }

  componentWillEnter(done) {
    
    const anim = this.itemRef.current.base.animate(
      [{transform: 'translateX(-10px)', opacity: '0'}, {}],
      { duration: 400, easing: 'ease-out', fill: 'both' }
    )
    anim.onfinish = done;
  }

  componentWillLeave(done) {
    const anim = this.itemRef.current.base.animate(
      [{}, {transform: 'translateX(10px)', opacity: '0'}],
      { duration: 400, easing: 'ease-in', fill: 'both' }
    )
    anim.onfinish = done;
  }

  render(props, state, context) {
    return cloneElement(props.children);
  }

}

export default Carousel;
