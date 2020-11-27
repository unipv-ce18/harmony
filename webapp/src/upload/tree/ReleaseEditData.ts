import {createId} from './eid';
import {SongMetadata} from './metadata';
import ResyncProperty from './ResyncProperty';
import EditTree, {SubmitAlert} from './EditTree';
import SongEditData from './SongEditData';
import ArtistEditData from './ArtistEditData';

const UNKNOWN_RELEASE_NAME = 'Unknown Release';

class ReleaseEditData {

  public readonly eid = createId();
  public readonly songs: SongEditData[] = [];
  public readonly editTree: EditTree;

  private _synced: boolean = false;
  public get synced(): boolean {
    return this._synced;
  }

  private _alerts: SubmitAlert[] = [];
  public get alerts(): SubmitAlert[] {
    return this._alerts;
  }

  public remoteId?: string = undefined;
  public date?: string = undefined;

  private _cover?: Blob;
  public get cover(): Blob | undefined {
    return this._cover;
  }

  private _name: ResyncProperty<string>;
  public get name(): string {
    return this._name.value;
  }
  public set name(v: string) {
    if (v !== '') this._name.value = v;
  }

  constructor(public readonly artist: ArtistEditData,
              name?: string, date?: string) {
    this.editTree = artist.editTree;
    this._name = new ResyncProperty(name || UNKNOWN_RELEASE_NAME, this.fetchRemoteData);
    this.date = date;
    if (name != null) this.fetchRemoteData();
  }

  /**
   * Add a song to this Edit Tree Release
   *
   * @param songFile - the song file to submit
   * @param songMetadata - Metadata for the given song
   */
  public addSong(songFile: File, songMetadata: SongMetadata) {
    const title = songMetadata.tags.TITLE || songFile.name;

    if (this._cover == null && songMetadata.picture != null)
      this._cover = songMetadata.picture.data;

    this.songs.push(new SongEditData(this, title, songMetadata.trackLength, songFile));
  }

  /**
   * Returns true if this release is valid and can be submitted
   *
   * @param deep - whether to check also songs for validity
   */
  public isValid(deep: boolean = true): boolean {
    return this.alerts.find(a => a.blocking) === undefined
      && (!deep ? true : this.songs.find(s => !s.isValid()) === undefined);
  }

  public onArtistUpdate() {
    this.fetchRemoteData();
  }

  private fetchRemoteData = () => {
    this.remoteId = undefined;
    this.editTree.metaSource.updateReleaseData(this).then(result => {
      this._alerts = result.alerts;
      this._synced = true;
      this.editTree.notifyTreeChange(this, result);
    });
  };

}

export default ReleaseEditData;
