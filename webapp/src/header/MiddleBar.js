import {Component} from "preact";

import {classList} from '../core/utils';
import logoImage from "!file-loader!../assets/logo.svg";
import SearchForm from '../components/search/form/SearchForm';

import style from './header.scss'

class MiddleBar extends Component {
  render(props) {
    const onHome = this.props.page === '/';
    const displaySearch = onHome || this.props.page?.startsWith('/search/');

    return (
      <div class={classList(style.middle, onHome && `on-home`)}>
        <img src={logoImage} alt=""/>
        {displaySearch && <SearchForm autofocus/>}
      </div>
    );

  }
}

export default MiddleBar;
