import {Component} from 'preact';

import {session} from '../Harmony';
import {classList} from '../core/utils';
import Themeable from '../components/Themeable';
import HarmonyLogo from '../components/HarmonyLogo';
import SearchForm from '../components/search/form/SearchForm';
import UserWidget from './UserWidget';
import UploadWidget from '../upload/UploadWidget';

import style from './header.scss';

const LOGO_COLLAPSE_DELAY_MS = 500;

class HeaderBar extends Component {

  state = {
    logoCollapsed: true,
    dropDownMenu: false
  }

  #previousPage = null;

  constructor() {
    super();
    this.onLogoMouseEvent = this.onLogoMouseEvent.bind(this);
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    if (nextProps.page !== this.props.page)
      this.#previousPage = this.props.page;
  }

  componentDidUpdate(previousProps, previousState, snapshot) {
    const {page} = this.props;
    if (previousProps.page !== page) {
      if (isHomePage(page)) {
        setTimeout(() => this.setState({logoCollapsed: true}), LOGO_COLLAPSE_DELAY_MS);
      } else {
        setTimeout(() => this.setState({logoCollapsed: false}), LOGO_COLLAPSE_DELAY_MS);
      }

      // Autofocus search bar if on home or search page
      if (isHomePage(page) || isSearchPage(page))
        this.base.querySelector('input[type=text]').focus();
    }
  }

  render({page}, {logoCollapsed}) {
    const onHome = isHomePage(page);
    const onSearch = isSearchPage(page);
    const onLogin = isLoginPage(page);
    const fromHome = isHomePage(this.#previousPage);

    return (
      <header class={classList(onLogin && 'on-login')}>
        {/* Left side - navigation */}
        <ul class={style.left}>
          <li><NavLink page={page} target='/'>Home</NavLink></li>
          <li><NavLink page={page} target='/library/me'>Library</NavLink></li>
        </ul>

        {/* Center - logo, search */}
        <div class={classList(style.middle, fromHome && 'from-home', onHome && `on-home`, onSearch && 'on-search')}>
          {!onLogin && <div><SearchForm/></div>}
          <Themeable propVariables={{color: '--th-logo-color'}}>
            <HarmonyLogo collapse={logoCollapsed}
                         onMouseEnter={this.onLogoMouseEvent} onMouseLeave={this.onLogoMouseEvent}/>
          </Themeable>
        </div>

        {/* Right side - user */}
        <div class={style.right}>
          <UserWidget/>
          {session.currentUser?.type === 'creator' && <UploadWidget/>}
        </div>
      </header>
    );
  }

  onLogoMouseEvent(e) {
    this.setState({logoCollapsed: e.type === 'mouseleave'})
  }
}

const NavLink = ({page, target, children}) => (<a class={page === target && 'current'} href={target}>{children}</a>);

const isLoginPage = page => page === '/login' || page === '/signup';
const isHomePage = page => page === '/';
const isSearchPage = page => page?.startsWith('/search/');

export default HeaderBar;
