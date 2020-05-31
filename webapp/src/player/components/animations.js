import {Component, createRef} from 'preact';

/**
 * Performs a fade-out animation altering CSS opacity and translation of the given element
 *
 * @param {Element} element The DOM element to animate
 * @param {Array} vector - Final translation coordinates
 * @param {number} duration - Animation duration in milliseconds
 * @return {Animation} The resulting animation instance
 */
export function fadeOut(element, vector, duration) {
  return element.animate(
    [{}, {transform: `translate(${vector[0]}px, ${vector[1]}px)`, opacity: '0'}],
    {duration, easing: 'ease-in', fill: 'both'}
  );
}

/**
 * Performs a fade-in animation altering CSS opacity and translation of the given element
 *
 * @param {Element} element The DOM element to animate
 * @param {Array} vector - Initial translation coordinates
 * @param {number} duration - Animation duration in milliseconds
 * @return {Animation} The resulting animation instance
 */
export function fadeIn(element, vector, duration) {
  return element.animate(
    [{transform: `translate(${vector[0]}px, ${vector[1]}px)`, opacity: '0'}, {}],
    {duration, easing: 'ease-out', fill: 'both'}
  );
}

/**
 * Performs a _First, Last, Invert, Play_ (FLIP) animation
 *
 * This technique allows to achieve smooth layout changes by measuring an element's coordinates, updating the DOM
 * and then creating the illusion that the new node is at the original location, animating back to its final position.
 *
 * Source and target element do not need to be the same node, however best results are obtained if both elements have
 * the same content and the same style.
 *
 * @see https://css-tricks.com/animating-layouts-with-the-flip-technique/
 * @see https://aerotwist.com/blog/flip-your-animations/
 *
 * @param {Element} dstObj - The final element on which deltas are calculated and the animation applied
 * @param {DOMRect} srcRect - The result of a call to `Element.getBoundingClientRect()` before the layout change
 * @param {Object} animOpts - Animation options passed to `Element.animate()`
 * @param {boolean} scale - Whether to use the component's size and add a `scale()` component to the transform
 * @return {Animation} The resulting animation instance
 */
export function flipAnim(dstObj, srcRect, animOpts, scale = false) {
  const dstRect = dstObj.getBoundingClientRect();
  const dX = srcRect.left - dstRect.left;
  const dY = srcRect.top - dstRect.top;
  let transform = `translate(${dX}px, ${dY}px)`;

  if (scale) {
    const dW = srcRect.width / dstRect.width;
    const dH = srcRect.height / dstRect.height;
    transform += ` scale(${dW}, ${dH})`;
  }

  return dstObj.animate([
    {transformOrigin: 'top left', transform},
    {transformOrigin: 'top left', transform: 'none'}
  ], animOpts);
}

/**
 * Holds state for FLIP animations for use inside (P)React
 *
 * Instantiate this class inside a common parent {@link Component} of nodes between which you want to perform
 * animations. A passed in `rules` defined allowed transitions and their animation options.
 *
 * `FlipContext.Node` components can then be used to wrap nodes you want to animate; two props are required:
 * - `group`: unique identifier of a source and/or destination, that can be `search/result` or `artist-page`;
 * - `tag`: identifies the element to match between source and destination, e.g. `album-art` or `track-title`.
 *
 * @example Creating an instance
 * flipContext = new FlipContext({
 *   'target-group': {
 *     'source-group': {duration: 500, easing: 'ease-in-out', fill: 'both'}
 *   }
 * });
 *
 * @example Defining a transition
 * render({mode, flipCtx: Flip}) {
 *   // If both nodes are on the same level, we need to assign a "key" to force component unmount/mount
 *   // otherwise P(React) does not trigger a DOM change (we could handle this but can get complex).
 *   return (
 *     <div>
 *       {mode === 1 && <Flip.Node key="a" group="source-group" id="test"><div>Test</div></Flip.Node>}
 *       {mode === 2 && <Flip.Node key="b" group="target-group" id="test"><div>Test</div></Flip.Node>}
 *     </div>
 *   );
 * }
 *
 * @constructor
 * @param {Object} rules - Allowed transitions and their animation options
 */
export function FlipContext(rules) {

  const _r = {};

  this.Node = class extends Component {

    ref = createRef();
    locationSaved = false;

    componentDidMount() {
      // console.log('mount', this.props.group, this.props.tag)
      const srcData = _r[this.props.tag];
      if (srcData == null) return;
      delete _r[this.props.tag];

      const transitionProps = rules[this.props.group][srcData.group]
      if (transitionProps)
        flipAnim(this.ref.current, srcData.rect, transitionProps);
      else
        console.warn('Cannot animate: group "%s" has no rule matching "%s', this.props.group, srcData.group);
    }

    componentWillUnmount() {
      // console.log('unmount', this.props.group, this.props.tag)
      if (!this.locationSaved) this.saveCurrentLocation();
    }

    /**
     * Triggers a {@link DOMRect} save before the wrapped component is unmounted, the location won't be saved
     * again on unmount.
     *
     * This can be used on the source element, for example, in the following cases:
     * - When it is not feasible to unmount it before mounting its corresponding target (e.g. inside a
     *   `TransitionGroup` `componentWillLeave` callback triggered by the same state change that will mount the target);
     * - When other animations playing at unmount time cause an alteration of the source location.
     */
    saveCurrentLocation() {
      const rect = this.ref.current.getBoundingClientRect();
      _r[this.props.tag] = {group: this.props.group, rect: rect};
      this.locationSaved = true;
    }

    render({children}) {
      children.ref = this.ref;
      return children;
    }
  }

}
