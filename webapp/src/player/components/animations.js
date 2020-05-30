const DEFAULT_DURATION = 300;

export function fadeOut(element, vector, duration=DEFAULT_DURATION) {
  return element.animate(
    [{}, {transform: `translate(${vector[0]}px, ${vector[1]}px)`, opacity: '0'}],
    {duration, easing: 'ease-in', fill: 'both'}
  );
}

export function fadeIn(element, vector, duration=DEFAULT_DURATION) {
  return element.animate(
    [{transform: `translate(${vector[0]}px, ${vector[1]}px)`, opacity: '0'}, {}],
    {duration, easing: 'ease-out', fill: 'both'}
  );
}
