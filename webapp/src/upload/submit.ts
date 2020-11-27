import {session} from '../Harmony';
import {AccessToken, createArtist, createRelease, createSong} from '../core/apiCalls';
import {EditTree} from './tree';
import UploadManager, {doUpload} from './upload/UploadManager';

// Wait some time between consecutive requests
const REQUEST_COOLDOWN_MS = 200;

const request: <T>(f: (token: AccessToken) => T) => Promise<T> =
  f => session.getAccessToken().then(f)
    .then(data => new Promise(resolve => setTimeout(() => resolve(data), REQUEST_COOLDOWN_MS)));


export async function submitTree(editTree: EditTree): Promise<void> {
  const uploadManager = new UploadManager();

  for (const artist of editTree.artists) {
    const artistId = artist.remoteId ??
      await request(token => createArtist(artist.name, token));

    for (const release of artist.releases) {
      const releaseId = release.remoteId ??
        await request(token => createRelease(artistId, {name: release.name, date: release.date}, token));

      // Upload cover art if we created a new release
      if (release.remoteId == null && release.cover != null) 
        await doUpload(uploadManager, 'release', releaseId, release.cover!);

      for (const song of release.songs)
        await request(token => createSong(releaseId, song.uploadId!, song.name, token));
    }
  }
}
