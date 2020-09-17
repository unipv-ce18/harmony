import {h, Component, ComponentType} from 'preact';

import {classList} from '../core/utils';
import {DEFAULT_ALBUMART_URL} from '../assets/defaults';
import {ArtistEditData, ReleaseEditData, SongEditData, RemoteUpdateEvent, SubmitAlert} from './tree';

import style from './editViews.scss';

type AEVProps = {data: ArtistEditData, alerts: SubmitAlert[]};
type REVProps = {data: ReleaseEditData, alerts: SubmitAlert[], getImageUrl: (blob?: Blob) => string};
type SEVProps = {data: SongEditData};

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

const AlertGroup = ({alerts}: {alerts: SubmitAlert[]}) => (
  <div>
    {alerts.map(a => (
      <div class={classList(style.alert, a.blocking && style.critical)}>{a.message}</div>
    ))}
  </div>
);

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

const SongEditView = ({data: song}: SEVProps) => (
  <div class={style.songEditView}>
    <input type="text" value={song.name}
      onChange={e => song.name = (e.target as HTMLInputElement).value}/>
  </div>
);

const ReleaseEditView = withUpdate(withBlobImage(ReleaseEditViewBase));

export const ArtistEditView = withUpdate(ArtistEditViewBase);
