import {Component} from 'preact';
import PropTypes from 'prop-types';

const PAD_SIZE = 10;

const Directions = Object.freeze({
  NONE: 0, NORTH: 1, WEST: 2, NORTHWEST: 3
});

/**
 * Wraps a single {@link Component} implementing `onResize(width, height, last)` and adds resize handles to it
 *
 * `onResize()` gets called during the drag operation to allow the target element to update its own size.
 */
class SizeControls extends Component {

  #wrapperRef = null;
  #contentRef = null;

  // Holds data about the current drag operation
  #dragStartInfo = null;

  static propTypes = {
    /**
     * Whenever size controls should be enabled
     */
    enabled: PropTypes.bool,

    /**
     * Child node to be resize, must implement `onResize(w, h, end)`
     */
    children: PropTypes.node.isRequired
  }

  state = {
    sizeDirection: Directions.NONE,
    dragging: false
  }

  constructor() {
    super();
    this.detectDirection = this.detectDirection.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragging = this.onDragging.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  componentWillMount() {
    // Check if the passed in child has 'onResize' and throw if not
    this.props.children.ref = (el) => {
      if ('onResize' in el && el.onResize instanceof Function)
        this.#contentRef = el;
      else
        throw TypeError('SizeControls child does not have onResize method')
    }
  }

  render({enabled, children}, {sizeDirection}) {
    const padding = enabled ? `${PAD_SIZE}px 0 0 ${PAD_SIZE}px` : '';
    return (
      <div ref={e => this.#wrapperRef = e}
           style={{padding, cursor: enabled ? getDirectionCursor(sizeDirection) : 'unset'}}
           onMouseMove={this.detectDirection}
           onMouseDown={this.onDragStart}>
        {children}
      </div>
    );
  }

  detectDirection(e) {
    if (!this.props.enabled || this.state.dragging) return;

    const newDirection = (() => {
      if (e.target !== this.#wrapperRef) return Directions.NONE;

      if (Math.abs(e.layerX - e.layerY) < PAD_SIZE) return Directions.NORTHWEST;
      if (e.layerX < PAD_SIZE) return Directions.WEST;
      if (e.layerY < PAD_SIZE) return Directions.NORTH;

      return null;
    })();

    if (newDirection != null && newDirection !== this.state.sizeDirection)
      this.setState({sizeDirection: newDirection});
  }

  onDragStart(e) {
    if (!this.props.enabled || e.target !== this.#wrapperRef) return;

    const clientRect = this.#wrapperRef.children[0].getBoundingClientRect();
    const dir = this.state.sizeDirection;
    this.#dragStartInfo = {
      x: e.screenX, y: e.screenY,
      w: clientRect.width, h: clientRect.height,
      i: dir === Directions.NORTHWEST || dir === Directions.WEST ? 1 : 0,
      j: dir === Directions.NORTHWEST || dir === Directions.NORTH ? 1 : 0
    };

    // Register window level event handlers for dragging
    document.body.addEventListener('mousemove', this.onDragging);
    document.body.addEventListener('mouseup', this.onDragEnd);
    this.setState({dragging: true});
  }

  onDragging(e) {
    this.#notifyNewSize(e)
  }

  onDragEnd(e) {
    document.body.removeEventListener('mousemove', this.onDragging);
    document.body.removeEventListener('mouseup', this.onDragEnd);
    this.setState({dragging: false});
    this.#notifyNewSize(e, true);
  }

  #notifyNewSize(e, last = false) {
    const {x, y, w, h, i, j} = this.#dragStartInfo;
    this.#contentRef.onResize(
      w + i * (x - e.screenX),
      h + j * (y - e.screenY),
      last)
  }

}

function getDirectionCursor(dir) {
  if (dir === Directions.NONE) return 'unset';
  if (dir === Directions.NORTH) return 'n-resize';
  if (dir === Directions.WEST) return 'w-resize';
  if (dir === Directions.NORTHWEST) return 'nw-resize';
}

export default SizeControls;
