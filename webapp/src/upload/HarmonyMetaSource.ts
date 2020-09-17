import {session} from '../Harmony';
import {execSearch, ArtistResult, getArtist} from '../core/apiCalls';
import {RemoteMetadataSource, RemoteUpdateEvent, SubmitAlert, ArtistEditData, ReleaseEditData} from './tree';

/**
 * Remote metadata source to allow Edit Tree entities to extract metadata from the Harmony API
 */
class HarmonyMetaSource implements RemoteMetadataSource {

  // To deduplicate/cache remote requests - assuming a remote entity is not modified before a page reload
  // TODO: we may want to clear the "requests" cache after an upload completes so we can see changes on next upload
  private readonly requests: {[query: string]: Promise<any>} = {};

  public async updateArtistData(artist: ArtistEditData): Promise<RemoteUpdateEvent> {
    const remoteArtist = await this.fetchRemoteArtist(artist.name);
    if (remoteArtist == null) {
      return {found: false, updated: false, alerts: [{blocking: false, message: "This artist will be created"}]};
    } 

    let updated = false;
    if (artist.remoteId !== remoteArtist.id) {
      artist.remoteId = remoteArtist.id;
      updated = true;
    }
    if (artist.remoteImage !== (remoteArtist.image ?? undefined)) {
      artist.remoteImage = remoteArtist.image ?? undefined;
      updated = true;
    }

    const alerts: SubmitAlert[] = [];
    if (session.currentUser!.id !== remoteArtist.creator)
      alerts.push({blocking: true, message: "You don't have the permission to change this artist"})

    return {found: true, updated, alerts};
  }

  public async updateReleaseData(release: ReleaseEditData): Promise<RemoteUpdateEvent> {
    // Should be already in pending requests
    const remoteArtist = await this.fetchRemoteArtist(release.artist.name);

    const remoteRelease = remoteArtist?.releases!.find(r => r.name === release.name);
    if (remoteRelease == null) return {found: false, updated: false, alerts: []};
    let updated = false;

    if (release.remoteId = remoteRelease.id) {
      release.remoteId = remoteRelease.id;
      updated = true;
    }
    
    const alerts: SubmitAlert[] = [];
    if (release.remoteId != null)
      alerts.push({blocking: false, message: "This release already exists, new songs will be added to it"})

    return {found: true, updated, alerts};
  }

  private async fetchRemoteArtist(name: string): Promise<ArtistResult | undefined> {
    if (name in this.requests) return this.requests[name];

    const fetch = session.getAccessToken().then(async token => {
      const results = await execSearch(token!, 'artists', name);
      for (const a of results.artists!)
        if (a.name === name) return getArtist(a.id, true, token!);
      return undefined;
    });

    return this.requests[name] = fetch;
  }
  
}

export default HarmonyMetaSource;
