import {cloneElement, Component, toChildArray} from 'preact';
import PropTypes from 'prop-types';

import {themeManager} from '../Harmony';

/**
 * Listens for changes on the application's theme and passes computed style properties
 * (usually CSS variables) as additional props to its children
 */
class Themeable extends Component {

  static propTypes = {
    /** A mapping from prop names to css attribute names to be resolved */
    propVariables: PropTypes.objectOf(PropTypes.string).isRequired
  }

  state = {childProps: null}

  constructor() {
    super();
    this.onThemeChange = this.onThemeChange.bind(this);
  }

  componentDidMount() {
    themeManager.addChangeListener(this.onThemeChange, true);
  }

  componentWillUnmount() {
    themeManager.removeChangeListener(this.onThemeChange);
  }

  render({children}, {childProps}) {
    return toChildArray(children).map(child => cloneElement(child, childProps))
  }

  onThemeChange(appClass, done) {
    const style = getComputedStyle(this.base);

    // For each key-value pair, map the value to its resolved attribute
    const childProps = Object.fromEntries(
      Object.entries(this.props.propVariables).map(([k, v]) => [k, style.getPropertyValue(v)]));
    this.setState({childProps}, done);
  }

}

export default Themeable;
