/* Ugliest hacks ever in this file to make the player look decent in reasonable time:
 *
 * These functions predict the size of UI components in PagePlayer after the expansion animation has occurred,
 * allowing to calculate font sizes for FLIP animations before opening of the player UI.
 *
 * An expand-calculate-rewind-animate approach can be explored at a later time...
 */

// TODO: import these from CSS

const NAVBAR_HEIGHT = 26;
const NAVBAR_MARGIN = 6;

const PAGE_PADDING_P = 0.04;  // %
const PAGE_PADDING_BOTTOM_P = 0.02;

const COVER_MAX_HEIGHT = 1;  // %
const COVER_MAX_WIDTH = .4;
const COVER_MARGIN_RIGHT = .04;  // %

const TITLE_BOX_HEIGHT = .20;  // %
const ARTIST_BOX_HEIGHT = .15;  // %

export function predictSongDataDomSize(targetPlayerSize) {
  // Remove the navbar height and margin
  let sz = [targetPlayerSize.width, targetPlayerSize.height - NAVBAR_HEIGHT - 2 * NAVBAR_MARGIN];

  // Remove page padding
  sz = [sz[0] * (1 - PAGE_PADDING_P * 2), sz[1] - sz[0] * (PAGE_PADDING_P + PAGE_PADDING_BOTTOM_P)];

  // Remove cover size and margin on the left
  const coverWidth = Math.min(COVER_MAX_HEIGHT * sz[1], COVER_MAX_WIDTH * sz[0]);
  sz = [sz[0] * (1 - COVER_MARGIN_RIGHT) - coverWidth, sz[1]];

  return {width: sz[0], height: sz[1]};
}

export function predictTitleFontSize({width, height}) {
  return getBoxFontSize({width, height: height * TITLE_BOX_HEIGHT})
}

export function predictArtistFontSize({width, height}) {
  return getBoxFontSize({width, height: height * ARTIST_BOX_HEIGHT})
}

export function getBoxFontSize(domRect) {
  return Math.min(domRect.height * 0.6, domRect.width * 0.07);
}
