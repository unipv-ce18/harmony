import {h, Component, ComponentType} from 'preact';

import {RemoteUpdateEvent, ReleaseEditData, SongEditData} from '../tree';
import UploadManager, {UploadStatusEvent} from './UploadManager';

// Global upload manager instance
export const UPLOAD_MANAGER = new UploadManager();

type WithSongUploadProps = {data: SongEditData};
export type WithSongUploadState = {uploadId?: string, progress: number, done: boolean, error: boolean};

export function withSongUpload<P extends WithSongUploadProps>(View: ComponentType<any>) {
  return class extends Component<P, WithSongUploadState> {

    private started: boolean = false;

    state = {
      uploadId: undefined,
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
      if (this.state.uploadId !== undefined) UPLOAD_MANAGER.cancelUploadTask(this.props.data.file, false);
    }

    render(props: P, state: WithSongUploadState) {
      return <View {...props} {...state}/>
    }

    private onDataChange = (release: ReleaseEditData, _?: RemoteUpdateEvent) => {
      if (!this.started && release.eid === this.props.data.release.eid &&
          release.isValid(false) && release.artist.isValid(false)) {
        this.started = true;
        UPLOAD_MANAGER.addUploadTask(this.props.data.file, this.onUploadStatus);
      }
    };

    private onUploadStatus = (e: UploadStatusEvent) => {
      switch (e.type) {
        case 'start':
          this.setState({uploadId: e.temporaryId});
          break;

        case 'progress':
          this.setState({progress: e.value})
          break;

        case 'done':
          // Store id in song data, making it valid
          this.props.data.uploadId = this.state.uploadId;
          this.setState({done: true});
          break;

        case 'error':
          this.setState({error: true});
          break;
      }
    };

  }
}
