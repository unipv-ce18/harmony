import {h, Component, createRef} from 'preact';
import {classList} from '../core/utils';

import style from './CircleProgress.scss';

type Props = {
  size: number,
  strokeWidth: number,
  strokeBg?: string,
  strokeFg: string,
  class?: string,
  progress?: number,
  indeterminate?: boolean
}

class CircleProgress extends Component<Props> {

  private readonly progressRef = createRef();

  componentDidUpdate(previousProps: Props) {
    // Temporarily disable transitions if switching from indeterminate mode,
    // this prevents a weird animation of progress going reverse from 100%.
    if (previousProps.indeterminate && !this.props.indeterminate) {
      this.progressRef.current.style.transition = 'none';
      setTimeout(() => this.progressRef.current.style.transition = null, 100);
    }
  }
  
  render({size, strokeWidth, strokeBg, strokeFg, class: cl, progress = 0, indeterminate}: Props) {
    const center = size / 2;
    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const circleProps = {cx: center, cy: center, r: radius, strokeWidth};
    const progressProps = indeterminate
      ? {style: {'--cc': strokeWidth, '--ce': .75 * circumference, '--ct': circumference}}
      : {strokeDasharray: circumference, strokeDashoffset: (1 - progress) * circumference};

    return (
      <svg class={classList(style.progress, cl, indeterminate && style.indeterminate)} width={size} height={size}>
        {strokeBg && <circle stroke={strokeBg} {...circleProps} />}
        <circle ref={this.progressRef} stroke={strokeFg} {...circleProps} {...progressProps} />
      </svg>
    );
  }

}

export default CircleProgress;
