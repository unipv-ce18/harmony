function makeIcon(mod, props) {
  const {viewBox, url} = mod.default;
  const use = `<use xlink:href="${url}"/>`
  return (<svg {...props} viewBox={viewBox} dangerouslySetInnerHTML={{__html: use}}/>)
}

export const IconMusic = (props) => makeIcon(require('./music_note-24px.svg'), props);
export const IconPlaylist = (props) => makeIcon(require('./library_books-24px.svg'), props);
export const IconEqualizer = (props) => makeIcon(require('./equalizer-24px.svg'), props);
