import {h, Component, ComponentType} from 'preact';

import {classList} from '../core/utils';
import {DEFAULT_ALBUMART_URL} from '../assets/defaults';
import {ArtistEditData, ReleaseEditData, SongEditData, RemoteUpdateEvent, SubmitAlert} from './tree';
import {withSongUpload, WithSongUploadState} from './upload/hoc';
import {IconErrorOutline, IconDone} from '../assets/icons/icons';
import Themeable from '../components/Themeable';
import CircleProgress from './CircleProgress';

import style from './editViews.scss';

type AEVProps = {data: ArtistEditData, alerts: SubmitAlert[]};
type REVProps = {data: ReleaseEditData, alerts: SubmitAlert[], getImageUrl: (blob?: Blob) => string};
type SEVProps = WithSongUploadState & {data: SongEditData};

type WithUpdateProps = {data: ArtistEditData | ReleaseEditData};

function withUpdate<P extends WithUpdateProps>(View: ComponentType<any>) {
  return class extends Component<P> {
    state = {alerts:[]};
    componentDidMount() {
      this.props.data.editTree.addTreeChangeListener(this.onDataChange);
    }
    componentWillUnmount() {
      this.props.data.editTree.removeTreeChangeListener(this.onDataChange);
    }
    render(props: P, {alerts}: any) {
      return <View {...props} alerts={alerts}/>;
    }
    private onDataChange = (object: ArtistEditData, {found, updated, alerts}: RemoteUpdateEvent) => {
      if (object.eid === this.props.data.eid) {
        if (updated) this.forceUpdate();
        this.setState({alerts});
      }
    };
  }
}

function withBlobImage<P>(View: ComponentType<any>) {
  return class extends Component<P> {
    private currentImage?: Blob;
    private currentImageUrl?: string;
    componentWillUnmount() {
      this.getImageUrl(undefined);
    }  
    render(props: P) {
      return <View {...props} getImageUrl={this.getImageUrl}/>;
    }
    private getImageUrl = (blob: Blob | undefined) => {
      if (blob === this.currentImage)
        return this.currentImageUrl;
  
      this.currentImage = blob;
      if (this.currentImageUrl != null)
        URL.revokeObjectURL(this.currentImageUrl);
      this.currentImageUrl = blob != null ? URL.createObjectURL(blob) : undefined;
      return this.currentImageUrl;
    }
  }
}

function formatDuration(duration: number) {
  const totalSecs = Math.round(duration / 1000);

  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs - (3600 * h)) / 60);
  const s = totalSecs - 3600 * h - 60 * m;

  const hs = h === 0 ? '' : (h < 10 ? '0' + h : h) + ':';
  const ms = (m < 10 ? '0' + m : m) + ':';
  const ss = (s < 10 ? '0' + s : s);
  return hs + ms + ss;
}

const AlertGroup = ({alerts}: {alerts: SubmitAlert[]}) => (
  <div>
    {alerts.map(a => (
      <div class={classList(style.alert, a.blocking && style.critical)}>{a.message}</div>
    ))}
  </div>
);

const UploadProgress = ({started, progress, done, error}: WithSongUploadState) => {
  if (!started) return null;

  if (error) return <IconErrorOutline class={style.error}/>;
  if (done) return <IconDone class={style.success}/>;

  const progressProps = {class: style.progress, size: 16, strokeWidth: 2};

  return (
    <Themeable propVariables={{'strokeFg': '--th-foreground'}}>
      {progress > 0
        // @ts-ignore
        ? <CircleProgress {...progressProps} progress={progress}/>
        // @ts-ignore
        : <CircleProgress {...progressProps} indeterminate/>
      }
    </Themeable>
  );
};

const ArtistEditViewBase = ({data: artist, alerts}: AEVProps) => (
  <div class={style.artistEditView} style={{ '--artist-img': `url(${artist.remoteImage ?? ''})` }}>
    <input type="text" value={artist.name}
      onChange={e => artist.name = (e.target as HTMLInputElement).value}/>
    <AlertGroup alerts={alerts}/>
    <ul>
      {artist.releases.map(r => <li><ReleaseEditView key={r.eid} data={r}/></li>)}
    </ul>
  </div>
);

const ReleaseEditViewBase = ({data: release, alerts, getImageUrl}: REVProps) => (
  <div class={style.releaseEditView}>
    <img src={getImageUrl(release.cover) ?? DEFAULT_ALBUMART_URL} alt=""/>
    <input type="text" placeholder="Release name" value={release.name}
      onChange={e => release.name = (e.target as HTMLInputElement).value}/>
    <input type="text" placeholder="date" value={release.date}
      onChange={e => release.date = (e.target as HTMLInputElement).value}/>
    <AlertGroup alerts={alerts} />
    <ul>
      {release.songs.map(s => <li><SongEditView key={s.eid} data={s}/></li>)}
    </ul>
  </div>
);

const SongEditViewBase = ({data: song, ...uploadState}: SEVProps) => (
  <div class={style.songEditView}>
    <input type="text" value={song.name}
      onChange={e => song.name = (e.target as HTMLInputElement).value}/>
    <span>{formatDuration(song.duration)}</span>
    <div><UploadProgress {...uploadState}/></div>
  </div>
);

const SongEditView = withSongUpload(SongEditViewBase);

const ReleaseEditView = withUpdate(withBlobImage(ReleaseEditViewBase));

export const ArtistEditView = withUpdate(ArtistEditViewBase);
