import {Component, ComponentChild} from "preact";
import {HarmonyIcon} from "../assets/icons/Icons";

type IconButtonProps = {
  name?: string,
  size?: number,
  icon: HarmonyIcon,
  onClick?: Function
}

declare class IconButton extends Component<IconButtonProps, {}>{
  render(props: IconButtonProps): ComponentChild;
}

export default IconButton;
