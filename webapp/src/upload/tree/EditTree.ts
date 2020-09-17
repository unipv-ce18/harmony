import {removeArrayElement} from '../../core/utils';
import {SongMetadata} from './metadata';
import ArtistEditData from './ArtistEditData';
import ReleaseEditData from './ReleaseEditData';

export type SubmitAlert = {blocking: boolean, message: string};
export type RemoteUpdateEvent = {found: boolean, updated: boolean, alerts: SubmitAlert[]};

/**
 * A metadata source to asynchronously enrich an edit tree's items
 */
export interface RemoteMetadataSource {

  /**
   * Updates the given artist providing additional information
   * 
   * @param artist - the artist
   * @returns whether the item was updated or not, plus additional optional data to pass to listeners
   */
  updateArtistData(artist: ArtistEditData): Promise<RemoteUpdateEvent>;


  /**
   * Updates the given release providing additional information
   * 
   * @param release - the release
   * @returns whether the item was updated or not, plus additional optional data to pass to listeners
   */
  updateReleaseData(release: ReleaseEditData): Promise<RemoteUpdateEvent>;

}

export type TreeChangeListener = (object: ArtistEditData | ReleaseEditData, updateResult: RemoteUpdateEvent) => void;

/**
 * Stores a list of songs to be submitted in an editable tree structure composed of artists ({@link ArtistEditData}),
 * releases ({@link ReleaseEditData}) and the songs themselves ({@link SongEditData}).
 * 
 * A {@link RemoteMetadataSource} should be provided to allows tree entities to synchronize with remote entities
 * provided by the source (which can be used e.g. to display an artist's image or detect if it needs to be created
 * remotely on submit).
 */
class EditTree {

  private readonly treeChangeListeners: TreeChangeListener[] = [];
  public readonly artists: ArtistEditData[] = [];

  constructor(public readonly metaSource: RemoteMetadataSource) { }

  /**
   * Adds a song along with its extracted metadata to this Edit Tree,
   * artists and releases missing in the tree are created and synced with the given `metaSource`.
   * 
   * @param file - The song file to add
   * @param songMetadata - Metadata for the given song
   */
  public addSong(songFile: File, songMetadata: SongMetadata) {
    const artistName = songMetadata.tags.ALBUMARTIST || songMetadata.tags.ARTIST;

    let artist = this.findArtist(artistName);
    if (artist == null) {
      artist = new ArtistEditData(this, artistName);
      this.artists.push(artist);
    }
    artist.addSong(songFile, songMetadata);
  }

  /**
   * Searches for an artist in this Edit Tree by name
   * 
   * @param name - the name of the artist
   * @returns the found {@link ArtistEditData} or `undefined` if not found
   */
  public findArtist(name?: string): ArtistEditData | undefined {
    return name ? this.artists.find(a => a.name === name) : undefined;
  }

  /**
   * Returns true if this tree can be submitted in its current state
   */
  public isValid(): boolean {
    return this.artists.find(a => !a.isValid()) === undefined;
  }

  /**
   * Registers a function to be called when an asynchronous change is made
   * (by the provided `metaSource`) to this Edit Tree
   * 
   * @param listener - the listener
   */
  public addTreeChangeListener(listener: TreeChangeListener) {
    this.treeChangeListeners.push(listener);
  }

  /**
   * Removes a previously registered tree change listener, throws if the listener cannot be found
   * 
   * @param listener - the listener to remove
   */
  public removeTreeChangeListener(listener: TreeChangeListener) {
    if (!removeArrayElement(this.treeChangeListeners, listener))
      throw new Error('Listener not found');
  }

  public notifyTreeChange(object: ArtistEditData | ReleaseEditData, updateResult: RemoteUpdateEvent) {
    this.treeChangeListeners.forEach(l => l(object, updateResult));
  }

}

export default EditTree;
