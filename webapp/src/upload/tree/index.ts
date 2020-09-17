import 'regenerator-runtime';

import EditTree, {TreeChangeListener, RemoteMetadataSource, RemoteUpdateEvent, SubmitAlert} from './EditTree';
import {readFlacMetadata, SongTags} from './metadata';
import ArtistEditData from './ArtistEditData';
import ReleaseEditData from './ReleaseEditData';
import SongEditData from './SongEditData';

const releaseHasCover = (tree: EditTree, meta: SongTags) =>
  tree.findArtist(meta.ALBUMARTIST || meta.ARTIST)?.findRelease(meta.ALBUM)?.cover != null;

export async function updateTree(tree: EditTree, songs: File[]) {
  const skipLoadPicture = releaseHasCover.bind(null, tree);
  for (const song of songs)
    tree.addSong(song, await readFlacMetadata(song, skipLoadPicture));
}

export {
  EditTree,
  TreeChangeListener,
  RemoteMetadataSource,
  RemoteUpdateEvent,
  SubmitAlert,
  ArtistEditData,
  ReleaseEditData,
  SongEditData
};
