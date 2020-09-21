import {createId} from './eid';
import EditTree from './EditTree';
import ReleaseEditData from './ReleaseEditData';

class SongEditData {

  public readonly eid = createId();
  public readonly editTree: EditTree;

  public uploadId?: string;

  constructor(public readonly release: ReleaseEditData,
              public name: string,
              public readonly duration: number,
              public readonly file: File) {
    this.editTree = release.editTree;
  }

  public isValid(): boolean {
    return this.uploadId !== undefined;
  }

}

export default SongEditData;
