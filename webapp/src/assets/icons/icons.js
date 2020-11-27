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

// Player frame
export const IconRadioOff = (props) => <Icon mod={require('./radio_button_unchecked-24px.svg')} {...props}/>;
export const IconRadioOn = (props) => <Icon mod={require('./radio_button_checked-24px.svg')} {...props}/>;
export const IconClose = (props) => <Icon mod={require('./close-24px.svg')} {...props}/>;

// Upload pane
export const IconCloudUpload = (props) => <Icon mod={require('./cloud_upload-24px.svg')} {...props}/>;
export const IconUploadFile = (props) => <Icon mod={require('./note_add-24px.svg')} {...props}/>;
export const IconUploadFolder = (props) => <Icon mod={require('./create_new_folder-24px.svg')} {...props}/>;
export const IconListExpand = (props) => <Icon mod={require('./unfold_more-24px.svg')} {...props}/>;
export const IconListCollapse = (props) => <Icon mod={require('./unfold_less-24px.svg')} {...props}/>;
export const IconFullscreen = (props) => <Icon mod={require('./fullscreen-24px.svg')} {...props}/>;
export const IconFullscreenExit = (props) => <Icon mod={require('./fullscreen_exit-24px.svg')} {...props}/>;
export const IconDone = (props) => <Icon mod={require('./done-24px.svg')} {...props}/>
export const IconErrorOutline = (props) => <Icon mod={require('./error_outline-24px.svg')} {...props}/>

// Library, Upload pane
export const IconExpand = (props) => <Icon mod={require('./expand_more-24px.svg')} {...props}/>;
export const IconCollapse = (props) => <Icon mod={require('./expand_less-24px.svg')} {...props}/>;

// CollectionPage
export const IconLockClose = (props) => <Icon mod={require('./lock-24px.svg')} {...props}/>;
export const IconLockOpen = (props) => <Icon mod={require('./lock_open-24px.svg')} {...props}/>;
export const IconQueue = (props) => <Icon mod={require('./queue-24px.svg')} {...props}/>;

// ReleaseInfo
export const IconEdit = (props) => <Icon mod={require('./edit-24px.svg')} {...props}/>;

// CollectionSongsTable
export const IconMore = (props) => <Icon mod={require('./more_vert-24px.svg')} {...props}/>;
export const IconStarEmpty = (props) => <Icon mod={require('./star_outline-24px.svg')} {...props}/>;
export const IconStarFull = (props) => <Icon mod={require('./star-24px.svg')} {...props}/>;
export const IconArrowRight = (props) => <Icon mod={require('./arrow_right-24px.svg')} {...props}/>;

// ArtistInfo
export const IconAdd = (props) => <Icon mod={require('./add_circle_outline-24px.svg')} {...props}/>;
export const IconRemove = (props) => <Icon mod={require('./remove_circle_outline-24px.svg')} {...props}/>;

// User
export const IconSettings = (props) => <Icon mod={require('./settings-24px.svg')} {...props}/>;
