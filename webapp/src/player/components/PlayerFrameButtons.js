 import {Component} from 'preact';

import {classList} from '../../core/utils';
import {IconClose, IconRadioOff, IconRadioOn} from '../../assets/icons/icons';
import IconButton from '../../components/IconButton';
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
    const playerNode = this.context.playerView.base;
    playerNode.addEventListener('mouseenter', this.onMouseEnterPlayer)
    playerNode.addEventListener('mouseleave', this.onMouseLeavePlayer)
  }

  componentWillUnmount() {
    const playerNode = this.context.playerView.base;
    if (playerNode != null) {
      playerNode.removeEventListener('mouseenter', this.onMouseEnterPlayer)
      playerNode.removeEventListener('mouseleave', this.onMouseLeavePlayer)
    }
  }

  onMouseEnterPlayer(e) {
    this.setState({closeShown: true});
  }

  onMouseLeavePlayer(e) {
    this.setState({closeShown: false});
  }

  render(props, {closeShown}, {player, playerView}) {
    return (
      <ul className={classList(style.buttons, !playerView.expanded && style.hidePin, !closeShown && style.hideClose)}>
        <li><IconButton size={24} name="Close" icon={IconClose}
                        onClick={() => player.shutdown()}/></li>
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
