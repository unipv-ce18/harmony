import {Component} from 'preact';

import {classList} from '../core/utils';
import HarmonyLogo from '../components/HarmonyLogo';
import SearchForm from '../components/search/form/SearchForm';
import UserWidget from './UserWidget';

import style from './header.scss';

const LOGO_COLLAPSE_DELAY_MS = 500;

class HeaderBar extends Component {

  state = {
    logoCollapsed: true,
    dropDownMenu: false
  }

  constructor() {
    super();
    this.onLogoMouseEvent = this.onLogoMouseEvent.bind(this);
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
    const onLogin = isLoginPage(page);

    return (
      <header>
        {/* Left side - navigation */}
        {!onLogin && (
          <ul className={style.left}>
            <li><NavLink page={page} target='/'>Home</NavLink></li>
            <li><NavLink page={page} target='/library/me'>Library</NavLink></li>
          </ul>
        )}

        {/* Center - logo, search */}
        <div className={classList(style.middle, onHome && `on-home`)}>
          {!onLogin && <div><SearchForm/></div>}
          <HarmonyLogo color="#ddd" collapse={logoCollapsed}
                       onMouseEnter={this.onLogoMouseEvent} onMouseLeave={this.onLogoMouseEvent}/>
        </div>

        {/* Right side - user */}
        {!onLogin && (
          <div className={style.right}>
            <UserWidget/>
          </div>
        )}
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
