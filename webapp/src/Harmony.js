import {Session} from "./core/Session";
import {MediaPlayer} from "./player/MediaPlayer";

export const session = new Session();
export const mediaPlayer = new MediaPlayer();


function printConsoleWelcome(body, bodyStyle) {
  console.log('%cWelcome to %cHarmony\n%c' + body,
    'font-size: 2em; font-family: sans-serif; color: #ccc',
    'font-size: 2em; font-style: italic; color: #fff',
    bodyStyle)
}

if (process.env.NODE_ENV === 'development') {
  printConsoleWelcome(
    'Player, session and catalog APIs are available here in the console for you to play with...',
    'color: #eee')
  Object.defineProperties(window, {
    session: { value: session },
    catalog: { value: catalog },
    player: { value: mediaPlayer },
    MediaItemInfo: { value: MediaItemInfo },
    PlayStartModes: { value: PlayStartModes }
  })
} else {
  printConsoleWelcome(
    'This is your browser\'s development console: if someone told you to paste something in here they probably want to mess with your account!',
    'font-weight: bold; font-family: sans-serif; color: #fc4')
}
