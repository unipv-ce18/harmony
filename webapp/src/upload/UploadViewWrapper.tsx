import {h, Component} from 'preact';

import style from './UploadView.scss';

type Props = {
  visible: boolean
}

type State = {
  uploadView?: typeof import('./UploadView').default
}

class UploadViewWrapper extends Component<Props, State> {

  componentDidUpdate(previousProps: Readonly<Props>, previousState: Readonly<State>) {
    if (this.props.visible && !previousProps.visible) {
      import(/* webpackChunkName: "upload" */ './UploadView')
        .then(m => this.setState({uploadView: m.default}));
    }
  }

  render(props: Props, {uploadView: UV}: State) {
    return (
      <div class={style.wrapper}>
        {UV && <UV/>}
      </div>
    );
  }

}

export default UploadViewWrapper;
