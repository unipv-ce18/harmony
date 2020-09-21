import {createId} from './eid';
import {SongMetadata} from './metadata';
import ResyncProperty from './ResyncProperty';
import EditTree, {SubmitAlert} from './EditTree';
import ReleaseEditData from './ReleaseEditData';

const UNKNOWN_ARTIST_NAME = 'Unknown Artist';

class ArtistEditData {

  public readonly eid = createId();
  public readonly releases: ReleaseEditData[] = [];

  private _alerts: SubmitAlert[] = [];
  public get alerts(): SubmitAlert[] {
    return this._alerts;
  }

  public remoteId?: string = undefined;
  public remoteImage?: string = undefined;

  private _name: ResyncProperty<string>;
  public get name(): string {
    return this._name.value;
  }
  public set name(v: string) {
    if (v !== '') this._name.value = v;
  }

  constructor(public readonly editTree: EditTree, name?: string) {
    this._name = new ResyncProperty(name || UNKNOWN_ARTIST_NAME, this.fetchRemoteData);
    if (name != null) this.fetchRemoteData();
  }

  /**
   * Add a song to this Edit Tree Artist, intermediary releases will be created as needed
   *
   * @param songFile - the song file to submit
   * @param songMetadata - Metadata for the given song
   */
  public addSong(songFile: File, songMetadata: SongMetadata) {
    const releaseName = songMetadata.tags.ALBUM;
    const releaseDate = songMetadata.tags.DATE;

    let release = this.findRelease(releaseName);
    if (release == null) {
      release = new ReleaseEditData(this, releaseName, releaseDate);
      this.releases.push(release);
    }
    release.addSong(songFile, songMetadata);
  }

  /**
   * Searches for a release in this artist
   *
   * @param name - the release name
   * @returns the found {@link ReleaseEditData} or `undefined` if not found
   */
  public findRelease(name?: string): ReleaseEditData | undefined {
    return name ? this.releases.find(r => r.name === name) : undefined;
  }

  /**
   * Returns true if this artist is valid and can be submitted
   *
   * @param deep - whether to check also releases and songs for validity
   */
  public isValid(deep: boolean = true): boolean {
    return this.alerts.find(a => a.blocking) === undefined
      && (!deep ? true : this.releases.find(r => !r.isValid()) === undefined);
  }

  private fetchRemoteData = () => {
    this.remoteId = undefined;
    this.remoteImage = undefined;
    this.editTree.metaSource.updateArtistData(this).then(result => {
      this._alerts = result.alerts;
      this.editTree.notifyTreeChange(this, result);
      for (const r of this.releases) r.onArtistUpdate();
    });
  };

}

export default ArtistEditData;
