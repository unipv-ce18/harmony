import {Session} from './core/Session';
import {MediaCatalog} from './core/MediaCatalog';
import {MediaPlayer, MediaItemInfo, PlayStartModes} from './player/MediaPlayer';
import {User} from './core/User';

export const session = new Session();
export const catalog = new MediaCatalog(session);
export const mediaPlayer = new MediaPlayer();
export const currentUser = new User(session, 'me');


if ('serviceWorker' in navigator && SERVICE_WORKER_PATH != null) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/' + SERVICE_WORKER_PATH));
}

function printConsoleWelcome(body, bodyStyle) {
  console.log('%cWelcome to %cHarmony\n%c' + body,
    'font-size: 2em; font-family: sans-serif; color: #ccc',
    'font-size: 2em; font-style: italic; color: #fff',
    bodyStyle);
}

switch (process.env.NODE_ENV) {
  case 'development':
    printConsoleWelcome(
      'Player, session, current user and catalog APIs are available here in the console for you to play with...',
      'color: #eee');
    Object.defineProperties(window, {
      session: { value: session },
      catalog: { value: catalog },
      player: { value: mediaPlayer },
      currentUser: { value: currentUser },
      MediaItemInfo: { value: MediaItemInfo },
      PlayStartModes: { value: PlayStartModes }
    });
    break;

  case 'test':
    break;

  default:
    printConsoleWelcome(
      'This is your browser\'s development console: if someone told you to paste something in here they probably want to mess with your account!',
      'font-weight: bold; font-family: sans-serif; color: #fc4');
}
