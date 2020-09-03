import {createId} from './eid';

class SongEditData {

  public readonly eid = createId();

  public name: string;

  constructor(name: string,
              public readonly duration: number,
              public readonly file: File) {
    this.name = name;
  }

}

export default SongEditData;
