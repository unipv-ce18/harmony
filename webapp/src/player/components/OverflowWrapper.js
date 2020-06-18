import {Component} from 'preact';
import PropTypes from 'prop-types';

import {classList} from '../../core/utils';

import style from './OverflowWrapper.scss';

const ANIM_PIXELS_PER_SECOND = 20;
const OVERFLOW_CLASS_NAME = 'overflow';  // Define globally so parent element can tweak style

/**
 * Detects (horizontal) overflow of the inner children and displays a scroll animation accordingly.
 */
class OverflowWrapper extends Component {

  static propTypes = {
    /** Class(es) to apply to the content viewport */
    viewportClass: PropTypes.string,
    /** Style to apply to the wrapper */
    style: PropTypes.object,
    /** The component's content */
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ])

  }

  state = {
    anim: null
  }

  #resizeObserver = new ResizeObserver(_ => this.recalculate());

  componentWillReceiveProps(nextProps, nextContext) {
    this.recalculate();
  }

  componentDidMount() {
    this.#resizeObserver.observe(this.base);
  }

  componentWillUnmount() {
    this.#resizeObserver.unobserve(this.base);
  }

  render({viewportClass, style: wrapperStyle, children}, {anim}) {
    const doesOverflow = anim != null;
    return (
      <div class={classList(style.wrapper, doesOverflow && OVERFLOW_CLASS_NAME)} style={wrapperStyle}>
        <div class={classList(style.viewport, doesOverflow && OVERFLOW_CLASS_NAME, viewportClass)}
             style={doesOverflow && {'--d': anim.d, '--t': anim.t}}>
          {children}
        </div>
      </div>
    )
  }

  /**
   * Triggers a layout recalculation
   */
  recalculate() {
    const wrapper = this.base;
    const viewport = wrapper.children[0];

    const delta = viewport.clientWidth - wrapper.clientWidth;
    const animTime = delta / ANIM_PIXELS_PER_SECOND;

    if (animTime > 0.5) {
      // Content overflows, enable animation style
      this.setState({anim: {d: `-${delta}px`, t: `${animTime}s`}});
    } else {
      this.setState({anim: null});
    }
  }

}

export default OverflowWrapper;
