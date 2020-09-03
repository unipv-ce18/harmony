import {createId} from './eid';
import {SongMetadata} from './metadata';
import ResyncProperty from './ResyncProperty';
import EditTree from './EditTree';
import SongEditData from './SongEditData';
import ArtistEditData from './ArtistEditData';

const UNKNOWN_RELEASE_NAME = 'Unknown Release';

class ReleaseEditData {

  public readonly eid = createId();
  public readonly songs: SongEditData[] = [];

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

  constructor(public readonly editTree: EditTree<any>,
              public readonly artist: ArtistEditData,
              name?: string, date?: string) {
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

    this.songs.push(new SongEditData(title, songMetadata.trackLength, songFile));
  }

  public onArtistUpdate() {
    this.fetchRemoteData();
  }

  private fetchRemoteData = () => {
    this.remoteId = undefined;
    this.editTree.metaSource.updateReleaseData(this).then(
      result => this.editTree.notifyTreeChange(this, result)
    );
  };

}

export default ReleaseEditData;
