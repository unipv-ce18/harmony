import {ModValueTypes} from './ModInput';

export const SEARCH_MODIFIERS = Object.freeze([
  {
    key: 'artists-only',
    input: 'a',
    displayName: 'Artists',
    description: 'Search for artists only',
    valueType: ModValueTypes.NONE,
    color: '255,167,37'
  },
  {
    key: 'releases-only',
    input: 'r',
    displayName: 'Releases',
    description: 'Search for releases only',
    valueType: ModValueTypes.NONE,
    color: '41,182,246'
  },
  {
    key: 'songs-only',
    input: 's',
    displayName: 'Songs',
    description: 'Search for songs only',
    valueType: ModValueTypes.NONE,
    color: '156,204,10'
  },
  {
    key: 'playlists-only',
    input: 'p',
    displayName: 'Playlists',
    description: 'Restrict search to playlists only',
    valueType: ModValueTypes.NONE,
    color: '171,71,188'  // Same color as genre, wanna fix?
  },
  {
    key: 'beats',
    input: 'b',
    displayName: 'BPM',
    description: 'Filter by song beats per minute',
    valueType: ModValueTypes.WORD,
    color: '38,166,154'
  },
  {
    key: 'genre',
    input: 'g',
    displayName: 'Genre',
    description: 'Filter by artist genre',
    valueType: ModValueTypes.STRING,
    color: '171,71,188'
  }
]);
