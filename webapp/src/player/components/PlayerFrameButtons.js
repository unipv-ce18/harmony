 import {Component} from 'preact';

import {classList} from '../../core/utils';
import {IconClose, IconRadioOff, IconRadioOn} from '../../assets/icons/icons';
import IconButton from './IconButton';
import {PlayerViewContextConsumer} from './PlayerViewContext';

import style from './PlayerFrameButtons.scss';

class PlayerFrameButtons extends Component {

  state = {
    closeShown: false
  }

  constructor() {
    super();
    this.onMouseEnterPlayer = this.onMouseEnterPlayer.bind(this);
    this.onMouseLeavePlayer = this.onMouseLeavePlayer.bind(this);
  }

  componentDidMount() {
    this.context.playerView.base.addEventListener('mouseenter', this.onMouseEnterPlayer)
    this.context.playerView.base.addEventListener('mouseleave', this.onMouseLeavePlayer)
  }

  componentWillUnmount() {
    this.context.playerView.base.removeEventListener('mouseenter', this.onMouseEnterPlayer)
    this.context.playerView.base.removeEventListener('mouseleave', this.onMouseLeavePlayer)
  }

  onMouseEnterPlayer(e) {
    this.setState({closeShown: true});
  }

  onMouseLeavePlayer(e) {
    this.setState({closeShown: false});
  }

  render(props, {closeShown}, {playerView}) {
    return (
      <ul className={classList(style.buttons, !playerView.expanded && style.hidePin, !closeShown && style.hideClose)}>
        <li><IconButton size={24} name="Close" icon={IconClose}
                        onClick={() => {/* TODO */}}/></li>
        <li><IconButton size={16}
                        name={playerView.pinned ? 'Unpin' : 'Pin'}
                        icon={playerView.pinned ? IconRadioOn : IconRadioOff}
                        onClick={() => playerView.pinned = !playerView.pinned}/></li>
      </ul>
    )
  }

  static contextType = PlayerViewContextConsumer.contextType;

}

export default PlayerFrameButtons;
