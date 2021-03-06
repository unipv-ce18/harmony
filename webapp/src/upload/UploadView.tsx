import {h, JSX, Component, ComponentChildren, FunctionalComponent} from 'preact';

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
import {ArtistEditData, EditTree, ReleaseEditData, RemoteUpdateEvent, updateTree} from './tree';
import HarmonyMetaSource from './HarmonyMetaSource';
import {ArtistEditView} from './editViews';
import Themeable from '../components/Themeable';
import CircleProgress from './CircleProgress';
import {submitTree} from './submit';
import {SONG_UPLOAD_MANAGER} from './upload/hoc';

import style from './UploadView.scss';

type State = {
  // Files are being dragged over
  dragOver: boolean,
  // The edit tree is valid and can be submitted
  canSubmit: boolean,
  // The form is being submitted
  beingSubmitted: boolean
}

class UploadView extends Component<{}, State> {

  state = {dragOver: false, canSubmit: false, beingSubmitted: false};

  private readonly editTree = new EditTree(new HarmonyMetaSource());

  constructor() {
    super();
    this.onFileDrop = this.onFileDrop.bind(this);
    this.editTree.addTreeChangeListener(this.onTreeChange);
  }

  componentDidMount() {
    SONG_UPLOAD_MANAGER.addIdleCallback(this.onTreeChange);
  }

  componentWillUnmount() {
    SONG_UPLOAD_MANAGER.removeIdleCallback(this.onTreeChange);
  }

  render(_: {}, {dragOver, canSubmit, beingSubmitted}: State) {
    const artistViews = this.editTree.artists.map(a => <ArtistEditView key={a.eid} data={a}/>);

    return (
      <DragArea class={classList(style.uploadView, dragOver && style.dragOver)}
                onDragStateChange={dragOver => this.setState({dragOver})} onDrop={this.onFileDrop}>
        <UploadHeader uv={this}/>
        {artistViews.length === 0 ? <EmptyView/> : [
          <div class={style.content}>{artistViews}</div>,
          <ActionButtons canSubmit={canSubmit} beingSubmitted={beingSubmitted} clearAction={this.handleClear} submitAction={this.handleSubmit}/>
        ]}
      </DragArea>
    );
  }

  openFileDialog(folders: boolean = false) {
    const dialog = Object.assign(document.createElement('input'), {
      type: 'file', multiple: true, webkitdirectory: folders
    });
    dialog.addEventListener('change', e => this.addFiles(files.fromFileDialog(e)));
    dialog.click();
  }

  onFileDrop(e: DragEvent) {
    e.preventDefault();
    this.setState({dragOver: false});

    files.fromDropEvent(e).then(fs => this.addFiles(fs));
  }

  private addFiles(fs: File[]) {
    // Disable submit to wait for server sync
    return updateTree(this.editTree, fs).then(() => this.setState({canSubmit: false}));
  }

  private readonly handleClear = () => {
    this.editTree.clear();
    this.setState({canSubmit: false, beingSubmitted: false});  // Also refreshes tree view
    (this.editTree.metaSource as HarmonyMetaSource).clearCache();
  }

  private readonly handleSubmit = () => {
    this.setState({canSubmit: false, beingSubmitted: true}, () => {
      submitTree(this.editTree).then(() => this.handleClear());
    });
  }

  private readonly onTreeChange = (object?: ArtistEditData | ReleaseEditData, _?: RemoteUpdateEvent) => {
    if (object != null && !object.isValid()) {
      // Shortcut if the current object is not valid
      this.setState({canSubmit: false});
    } else {
      // Check the whole tree
      this.setState({canSubmit: this.editTree.isValid()});
    }
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

type ActionButtonsProps = {
  canSubmit: boolean,
  beingSubmitted: boolean,
  clearAction: (e: MouseEvent) => void,
  submitAction: (e: MouseEvent) => void
}

const ActionButtons = ({canSubmit, beingSubmitted, clearAction, submitAction}: ActionButtonsProps) => (
  <div class={style.actionButtons}>
    <button onClick={clearAction}>Clear All</button>
    <button onClick={submitAction} disabled={!canSubmit} class={classList(beingSubmitted && style.submitting)}>
      <span>Submit</span>
      {beingSubmitted && (
          // @ts-ignore
          <Themeable propVariables={{ 'strokeFg': '--th-upload-footer-btn-hi-fg-disabled' }}><CircleProgress size={16} strokeWidth={2} indeterminate /></Themeable>
      )}
    </button>
  </div>
);

type DragAreaProps = JSX.HTMLAttributes & {
  children?: ComponentChildren,
  onDragStateChange: (dragIn: boolean) => void
};

const DragArea: FunctionalComponent<DragAreaProps> = ({children, onDragStateChange, ...props}) => (
  <div onDragEnter={() => onDragStateChange(true)} onDragLeave={() => onDragStateChange(false)}
       onDragOver={(e: Event) => e.preventDefault()} {...props}>{children}</div>
);

export default UploadView;
