import {Component} from 'preact';

import {fadeIn} from './animations';

import style from '../App.scss'

const PAGE_TRANSITION_LEN = parseInt(style.pageTransitionLen);

class HarmonyPage extends Component {

  componentWillEnter(done) {
    if (this.base)
      fadeIn(this.base, null, PAGE_TRANSITION_LEN, 0, 'none').onfinish = done;
    else
      requestAnimationFrame(done);
  }

  componentWillLeave(done) {
    this.base.classList.add(style.pageLeaving);
    setTimeout(done, PAGE_TRANSITION_LEN);
  }

}

export default HarmonyPage;
