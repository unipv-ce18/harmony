import {cloneElement, Component, createRef} from 'preact';
import TransitionGroup from 'preact-transition-group';
import PropTypes from 'prop-types'
import * as animations from './animations';

import style from './Carousel.scss';

const TRANSITION_LEN = parseInt(style.playerTransitionLen);

/**
 * A stateless multi-page carousel, selection is made over the key iof its children
 */
class Carousel extends Component {

  static propTypes = {
    /** List of pages that can be shown, selection is based on their `key` attribute */
    children: PropTypes.arrayOf(PropTypes.node),
    /** The currently selected node key */
    selected: PropTypes.string,
    /** Whether to allow content overflow */
    overflow: PropTypes.bool
  }

  // Index delta between previous and current selection: used to determine animation direction
  transitionDirection = 0;
  currentIndex = 0;

  componentWillReceiveProps(nextProps, nextContext) {
    const nextIndex = nextProps.children.findIndex(c => c.key === nextProps.selected);
    this.transitionDirection = nextIndex - this.currentIndex;
    this.currentIndex = nextIndex;
  }

  render({children, selected, overflow}) {
    const currentPage = children[this.currentIndex];
    return (
      <TransitionGroup class={style.carousel} style={{overflow: overflow ? 'visible' : 'hidden'}}>
        <Carousel.Page carousel={this} key={currentPage.key}>{currentPage}</Carousel.Page>
      </TransitionGroup>
    );
  }

}

/**
 * A page in the carousel, primarily handles visual transitions between pages
 */
Carousel.Page = class extends Component {

  static propTypes = {
    /** The page's content */
    children: PropTypes.node,
    /** The parent carousel */
    carousel: PropTypes.instanceOf(Carousel)
  }

  itemRef = createRef();

  constructor(props, context) {
    super(props, context);
    props.children.ref = this.itemRef;
  }

  componentWillEnter(done) {
    const child = this.itemRef.current;
    if (child.componentWillEnter != null && child.componentWillEnter(done) === true) return;

    const anim = animations.fadeIn(child.base,
      [Math.sign(this.props.carousel.transitionDirection) * 40, 0], TRANSITION_LEN);
    anim.onfinish = done;
  }

  componentWillLeave(done) {
    const child = this.itemRef.current;
    if (child.componentWillLeave != null && child.componentWillLeave(done) === true) return;

    const anim = animations.fadeOut(child.base,
      [Math.sign(this.props.carousel.transitionDirection) * -40, 0], TRANSITION_LEN);
    anim.onfinish = done;
  }

  render({children}) {
    return cloneElement(children);
  }

}

export default Carousel;
