import {Component} from 'preact';
import PropTypes from 'prop-types';

import {classList} from '../core/utils';
import logo from '!file-loader!../assets/logo.svg';

const LOGO_ID = 'logo';
const LOGO_READY_CLASS = 'ready';
const LOGO_ANIMATE_CLASS = 'animate';
const LOGO_COLLAPSE_CLASS = 'collapse';
const LOGO_COLOR_DEFAULT = '#eee';

class HarmonyLogo extends Component {

  static propTypes = {
    /** Color of the logo */
    color: PropTypes.string,
    /** Whether to animate in the logo */
    animate: PropTypes.bool,
    /** Whether the loso should be collapsed */
    collapse: PropTypes.bool
  }

  state = {
    logoElement: null,
  }

  constructor() {
    super();
    this.onLogoLoaded = this.onLogoLoaded.bind(this);
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    if (this.state.logoElement != null) this.#updateLogo(this.state.logoElement);
  }

  render({color, animate, collapse, ...props}, {logoElement}) {
    return (<object data={logo} type="image/svg+xml" onLoad={this.onLogoLoaded}
                    style={logoElement == null && {opacity: 0}} {...props}/>);
  }

  onLogoLoaded() {
    const logoElement = this.base.contentDocument.getElementById(LOGO_ID);
    this.#updateLogo(logoElement, false);

    // Apply a "ready" class to enable animations later to avoid collapsing on load
    setTimeout(() => {
      logoElement.classList.add(LOGO_READY_CLASS);
      this.setState({logoElement});
    }, 0);
  }

  #updateLogo(logoElement, ready = true) {
    const {color, animate, collapse} = this.props;
    logoElement.style.stroke = color || LOGO_COLOR_DEFAULT;
    logoElement.setAttribute('class',
      classList(ready && LOGO_READY_CLASS, animate && LOGO_ANIMATE_CLASS, collapse && LOGO_COLLAPSE_CLASS));
  }

}

export default HarmonyLogo;
