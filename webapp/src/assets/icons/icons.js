function Icon({mod, ...props}) {
  const {viewBox, url} = mod.default;
  const use = `<use xlink:href="${url}"/>`
  return (<svg {...props} viewBox={viewBox} dangerouslySetInnerHTML={{__html: use}}/>)
}

// Player tabs
export const IconMusic = (props) => <Icon mod={require('./music_note-24px.svg')} {...props}/>;
export const IconPlaylist = (props) => <Icon mod={require('./library_books-24px.svg')} {...props}/>;
export const IconEqualizer = (props) => <Icon mod={require('./equalizer-24px.svg')} {...props}/>;

// Player generic
export const IconPlay = (props) => <Icon mod={require('./play_arrow-24px.svg')} {...props}/>;
export const IconPause = (props) => <Icon mod={require('./pause-24px.svg')} {...props}/>;

// Player main page
export const IconTrackNext = (props) => <Icon mod={require('./fast_forward-24px.svg')} {...props}/>;
export const IconTrackPrev = (props) => <Icon mod={require('./fast_rewind-24px.svg')} {...props}/>;
export const IconTrackRepeat = (props) => <Icon mod={require('./repeat-24px.svg')} {...props}/>;
export const IconTrackShuffle = (props) => <Icon mod={require('./shuffle-24px.svg')} {...props}/>;
