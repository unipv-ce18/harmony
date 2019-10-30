/**
 * Returns the number of seconds since the Epoch (a.k.a. Unix time)
 *
 * @returns {number} The current Unix time
 */
export const getCurrentTime = () => Math.round((new Date()).getTime() / 1000);
