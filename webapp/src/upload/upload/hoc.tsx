import {h, Component, ComponentType} from 'preact';

import {RemoteUpdateEvent, ReleaseEditData, SongEditData} from '../tree';
import UploadManager, {UploadStatusEvent} from './UploadManager';

// Global upload manager instance
export const SONG_UPLOAD_MANAGER = new UploadManager();

type WithSongUploadProps = {data: SongEditData};
export type WithSongUploadState = {started: boolean, progress: number, done: boolean, error: boolean};

export function withSongUpload<P extends WithSongUploadProps>(View: ComponentType<any>) {
  return class extends Component<P, WithSongUploadState> {

    private enqueued: boolean = false;
    private uploadId?: string = undefined;

    state = {
      started: false,
      progress: 0,
      done: false,
      error: false
    }

    componentDidMount() {
      const song = this.props.data;
      song.editTree.addTreeChangeListener(this.onDataChange);

      // If added to an existing synced release, check if valid then start upload now
      if (song.release.synced) this.onDataChange(song.release);
    }

    componentWillUnmount() {
      this.props.data.editTree.removeTreeChangeListener(this.onDataChange);
      if (this.uploadId !== undefined) SONG_UPLOAD_MANAGER.cancelUploadTask(this.props.data.file, false);
    }

    render(props: P, state: WithSongUploadState) {
      return <View {...props} {...state}/>
    }

    private onDataChange = (release: ReleaseEditData, _?: RemoteUpdateEvent) => {
      if (!this.enqueued && release.eid === this.props.data.release.eid &&
          release.isValid(false) && release.artist.isValid(false)) {
        this.enqueued = true;
        SONG_UPLOAD_MANAGER.addUploadTask('song', undefined, this.props.data.file, this.onUploadStatus);
      }
    };

    private onUploadStatus = (e: UploadStatusEvent) => {
      switch (e.type) {
        case 'start':  // When the upload task is started
          this.setState({started: true});
          break;

        case 'upload':  // When server returns upload id and post options
          this.uploadId = e.temporaryId;
          break;

        case 'progress':
          this.setState({progress: e.value})
          break;

        case 'done':
          // Store id in song data, making it valid
          this.props.data.uploadId = this.uploadId;
          this.setState({done: true});
          break;

        case 'error':
          this.setState({error: true});
          break;
      }
    };

  }
}
