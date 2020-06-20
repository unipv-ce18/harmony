import ColorThief from 'colorthief';

export const COLOR_BACKGROUND = 'bg';
export const COLOR_TEXT = 'text';

const colorThief = new ColorThief();

const TEXT_COLOR_THRESHOLD = 127;

export function createPalette(image) {
  return new Promise(resolve => {
    if (image.complete)
      resolve(colorThief.getColor(image));
    else
      image.addEventListener('load', () => resolve(colorThief.getColor(image)));
  }).then(([r, g, b]) => {
    // Grayscale conversion: https://en.wikipedia.org/wiki/Grayscale
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b

    return {
      [COLOR_BACKGROUND]: `${r},${g},${b}`,
      [COLOR_TEXT]: Y > TEXT_COLOR_THRESHOLD ? '0,0,0' : '240,240,240'
    }
  });
}
