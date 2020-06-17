import ColorThief from 'colorthief';

export const COLOR_BACKGROUND = 'bg';
export const COLOR_TEXT = 'text';

const colorThief = new ColorThief();

const cssColor = (r, g, b) => `rgb(${r}, ${g}, ${b})`;

export function createPalette(image) {
  return new Promise(resolve => {
    if (image.complete)
      resolve(colorThief.getColor(image));
    else
      image.addEventListener('load', () => resolve(colorThief.getColor(image)));
  }).then(([r, g, b]) => {
    // Grayscale conversion: https://en.wikipedia.org/wiki/Grayscale
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    console.log(Y)

    return {
      [COLOR_BACKGROUND]: cssColor(r, g, b),
      [COLOR_TEXT]: Y > 127 ? '0,0,0' : '240,240,240'
    }
  });
}
