import {session} from '../../Harmony';
import {removeArrayElement} from '../../core/utils';
import {uploadContent} from '../../core/apiCalls';

type UploadGenericEvent = {type: 'start' | 'done' | 'error'};
type UploadStartEvent = {type: 'upload', temporaryId: string};
type UploadProgressEvent = {type: 'progress', value: number};

export type UploadStatusEvent = UploadGenericEvent | UploadStartEvent | UploadProgressEvent;
type UploadStatusListener = (event: UploadStatusEvent) => void;

type PendingUploadEntry = {file: File, onUpdate: UploadStatusListener};
type CurrentUploadEntry = PendingUploadEntry & {aborted?: boolean, xhr?: XMLHttpRequest}

const CONCURRENT_UPLOAD_COUNT = 3;
const UPLOAD_CATEGORY = 'song';

/**
 * Maintains a queue of song upload tasks and notifies about their status
 */
class UploadManager {

  private readonly pendingUploads: Array<PendingUploadEntry> = [];
  private readonly currentUploads: Array<CurrentUploadEntry> = [];

  private idleCallbacks: Array<() => void> = [];

  /**
   * Adds a new song upload task
   *
   * @param file - the file to be uploaded
   * @param onUpdate - a callback receiving status notifications for the task
   */
  public addUploadTask(file: File, onUpdate: UploadStatusListener) {
    this.pendingUploads.push({file, onUpdate});
    this.startNewUploads();
  }

  /**
   * Cancels a previously scheduled upload task
   *
   * @param file - the file for which the upload should be cancelled
   * @param startNextTask - `false` if no new tasks should be enqueued for execution
   */
  public cancelUploadTask(file: File, startNextTask: boolean = true) {
    let idx = this.pendingUploads.findIndex(u => u.file === file);
    if (idx !== -1) {
      this.pendingUploads.splice(idx, 1);
      return true;
    }

    idx = this.currentUploads.findIndex(u => u.file === file);
    if (idx !== -1) {
      const u = this.currentUploads[idx];
      u.xhr !== undefined ? u.xhr.abort() : u.aborted = true;
      this.currentUploads.splice(idx, 1);
      this.startNewUploads(!startNextTask);
      return true;
    }

    return false;
  }

  /**
   * Registers an idle callback that will be invoked when this manager has finished all of its tasks
   *
   * @param f - the callback
   */
  public addIdleCallback(f: () => void) {
    this.idleCallbacks.push(f);
  }

  /**
   * Removes a previously registered idle callback
   *
   * @param f - the callback
   */
  public removeIdleCallback(f: () => void) {
    removeArrayElement(this.idleCallbacks, f);
  }

  private startNewUploads(noop: boolean = false) {
    if (this.pendingUploads.length === 0 && this.currentUploads.length === 0) {
      this.idleCallbacks.forEach(f => f());
      return;
    }
    if (noop) return;

    while (this.currentUploads.length < CONCURRENT_UPLOAD_COUNT) {
      const newUpload = this.pendingUploads.shift()! as CurrentUploadEntry;
      if (newUpload === undefined) break;

      this.currentUploads.push(newUpload);
      newUpload.onUpdate({type: 'start'});

      session.getAccessToken()
        .then(token => {
          // Firefox fix
          const mimeType = newUpload.file.type === 'audio/x-flac' ? 'audio/flac' : newUpload.file.type;
          return uploadContent(UPLOAD_CATEGORY, undefined, mimeType, newUpload.file.size, token!)
        })
        .then(([url, presignedData]) => {
          newUpload.onUpdate({type: 'upload', temporaryId: presignedData['key']});
          return newUpload.aborted
            ? Promise.reject(undefined)
            : postData(newUpload, url, presignedData);
        })
        .then(
          xhr => newUpload.onUpdate({type: 'done'}),
          xhr => newUpload.onUpdate({type: 'error'})
        )
        .finally(() => {
          removeArrayElement(this.currentUploads, newUpload);
          this.startNewUploads();
        });
    }
  }

}

function postData(upload: CurrentUploadEntry, url: string, presignedData: {[k: string]: any}) {
  const formData = new FormData();
  for (const [k, v] of Object.entries(presignedData)) formData.append(k, v);
  formData.append('file', upload.file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);

  xhr.upload.addEventListener('progress', e => upload.onUpdate({type: 'progress', value: e.loaded / e.total}));

  return new Promise((resolve, reject) => {
    // finish events, status is 0 in case of error/abort
    xhr.addEventListener('loadend', e => {
      //console.log(xhr.status, xhr.response);
      (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr) : reject(xhr);
    });

    if (upload.aborted) {
      reject(undefined);
    } else {
      upload.xhr = xhr;
      xhr.send(formData);
    }
  });
}

export default UploadManager;
