/**
 * Removes a single element from an array
 * 
 * @param array The array to operate upon
 * @param element The element to remove
 * @returns {boolean} `true` if the element was found (and removed)
 */
export function removeArrayElement<T>(array: T[], element: T): boolean {
  const idx = array.findIndex(e => e === element);
  if (idx !== -1) {
    array.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Returns the number of seconds since the Epoch (a.k.a. Unix time)
 *
 * @returns {number} The current Unix time
 */
export const getCurrentTime = () => Math.round((new Date()).getTime() / 1000);

/**
 * Utility function to join a list of CSS class names for use in a React rendering (a.k.a. the "classnames" package)
 *
 * @example
 * render(props, {expanded, dragging}) {
 *   return (
 *     <div className={classList(
 *       'player',
 *       expanded && 'expanded',
 *       dragging && 'dragging'
 *     )}></div>
 *   );
 * }
 *
 * @param classes Array of classes to apply, `false` values get discarded
 * @return {string} The value to apply to `className`
 */
export const classList = (...classes: Array<string | boolean | undefined>) => classes.filter(c => !!c).join(' ');
