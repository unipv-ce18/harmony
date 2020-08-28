import {h, Component} from 'preact';

import IconButton from '../components/IconButton';
import UploadViewWrapper from "./UploadViewWrapper";
import {IconClose} from "../assets/icons/icons";
import {classList} from "../core/utils";

import style from './UploadWidget.scss';

type State = {
  open: boolean
}

class UploadWidget extends Component<{}, State> {

  state: State = {open: false};

  render(_: {}, {open}: State) {
    return (
      <div class={classList(style.uploadWidget, open && style.open)}>
        <IconButton name="Upload content" size={24} icon={IconClose}
                    onClick={() => this.setState({open: !open})}/>
        <UploadViewWrapper visible={open}/>
      </div>
    );
  }

}

export default UploadWidget;
