import {h, JSX, Component, FunctionalComponent} from 'preact';

import {classList} from '../core/utils';
import IconButton from '../components/IconButton';
import {
  IconCloudUpload,
  IconFullscreen,
  IconListCollapse,
  IconUploadFile,
  IconUploadFolder
} from '../assets/icons/icons';
import * as files from './files';
import {EditTree, updateTree} from './tree';
import HarmonyMetaSource from './HarmonyMetaSource';
import {ArtistEditView} from './editViews';

import style from './UploadView.scss';

interface State {
  // Files are being dragged over
  dragOver: boolean
}

class UploadView extends Component<{}, State> {

  state = {dragOver: false};

  private readonly editTree = new EditTree(new HarmonyMetaSource());

  constructor() {
    super();
    this.onFileDrop = this.onFileDrop.bind(this);
  }

  render(_: {}, {dragOver}: State) {
    const artistViews = this.editTree.artists.map(a => <ArtistEditView key={a.eid} data={a}/>);

    return (
      <DragArea class={classList(style.uploadView, dragOver && style.dragOver)}
                onDragStateChange={dragOver => this.setState({dragOver})} onDrop={this.onFileDrop}>
        <UploadHeader uv={this}/>
        {artistViews.length === 0 ? <EmptyView/> : <div class={style.content}>{artistViews}</div>}
      </DragArea>
    );
  }

  openFileDialog(folders: boolean = false) {
    const dialog = Object.assign(document.createElement('input'), {
      type: 'file', multiple: true, webkitdirectory: folders
    });
    dialog.addEventListener('change', (e: Event) => {
      updateTree(this.editTree, files.fromFileDialog(e)).then(() => this.forceUpdate());
    });
    dialog.click();
  }

  onFileDrop(e: DragEvent) {
    e.preventDefault();
    this.setState({dragOver: false});

    files.fromDropEvent(e)
      .then(files => updateTree(this.editTree, files))
      .then(() => this.forceUpdate());
  }

}

const UploadHeader: FunctionalComponent<{uv: UploadView}> = ({uv}) => (
  <div class={style.header}>
    <span>Content upload</span>
    <IconButton icon={IconFullscreen} name="Fullscreen" size={24}
                onClick={() => /* TODO */ alert('Sorry, not implemented')}/>
    <IconButton icon={IconListCollapse} name="Collapse list" size={24}
                onClick={() => /* TODO */ alert('Sorry, not implemented')}/>
    <IconButton icon={IconUploadFolder} name="Upload folder" size={24}
                onClick={() => uv.openFileDialog(true)}/>
    <IconButton icon={IconUploadFile} name="Upload file" size={24}
                onClick={() => uv.openFileDialog(false)}/>
  </div>
);

const EmptyView = () => (
  <div class={style.empty}>
    <IconCloudUpload/>
    <em>Drag n' drop files and folders here to upload some beats!</em>
  </div>
);

type DragAreaProps = JSX.HTMLAttributes & {
  children?: JSX.Element[],
  onDragStateChange: (dragIn: boolean) => void
};

const DragArea: FunctionalComponent<DragAreaProps> = ({children, onDragStateChange, ...props}) => (
  <div onDragEnter={() => onDragStateChange(true)} onDragLeave={() => onDragStateChange(false)}
       onDragOver={(e: Event) => e.preventDefault()} {...props}>{children}</div>
);

export default UploadView;
