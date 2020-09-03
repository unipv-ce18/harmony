import 'regenerator-runtime';

import EditTree, {RemoteMetadataSource, RemoteMetadataResult} from './EditTree';
import {readFlacMetadata, SongTags} from './metadata';
import ArtistEditData from './ArtistEditData';
import ReleaseEditData from './ReleaseEditData';
import SongEditData from './SongEditData';

const releaseHasCover = (tree: EditTree<any>, meta: SongTags) =>
  tree.findArtist(meta.ALBUMARTIST || meta.ARTIST)?.findRelease(meta.ALBUM)?.cover != null;

export async function updateTree(tree: EditTree<any>, songs: File[]) {
  const skipLoadPicture = releaseHasCover.bind(null, tree);
  for (const song of songs)
    tree.addSong(song, await readFlacMetadata(song, skipLoadPicture));
}

export {EditTree, RemoteMetadataSource, RemoteMetadataResult, ArtistEditData, ReleaseEditData, SongEditData};
