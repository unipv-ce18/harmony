function Icon({mod, ...props}) {
  const {viewBox, url} = mod.default;
  const use = `<use xlink:href="${url}"/>`
  return (<svg {...props} viewBox={viewBox} dangerouslySetInnerHTML={{__html: use}}/>)
}

export const IconMusic = (props) => <Icon mod={require('./music_note-24px.svg')} {...props}/>;
export const IconPlaylist = (props) => <Icon mod={require('./library_books-24px.svg')} {...props}/>;
export const IconEqualizer = (props) => <Icon mod={require('./equalizer-24px.svg')} {...props}/>;
