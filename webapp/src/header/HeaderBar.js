import {Component} from 'preact';

import {classList} from '../core/utils';
import {session} from '../Harmony';
import HarmonyLogo from '../components/HarmonyLogo';
import SearchForm from '../components/search/form/SearchForm';
import {DEFAULT_USER_IMAGE_URL} from '../assets/defaults';

import style from './header.scss';
import {route} from 'preact-router';

const LOGO_COLLAPSE_DELAY_MS = 500;

class HeaderBar extends Component {

  state = {
    logoCollapsed: true,
    dropDownMenu: false
  }

  constructor() {
    super();
    this.onLogoMouseEvent = this.onLogoMouseEvent.bind(this);
    this.clickUser = this.clickUser.bind(this);
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

  clickCreator(e) {
     e.preventDefault();
     route('/user/me');
  }

  clickUser(e) {
    this.setState(prevState => ({ dropDownMenu: !prevState.dropDownMenu}));
    //console.log(e);
    //e.target.style = 'background-color: black; transition: background-color 200ms';
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
          <div className={classList(style.right, this.state.dropDownMenu && `drop-down`)}>
            <div title="User" onClick={this.clickUser}>
              <div>
                <span>{session.getOwnData().username}</span>
                <img src={DEFAULT_USER_IMAGE_URL} alt="" />
              </div>
              <div>
                <div title="User Page" onClick={this.clickCreator.bind(this)}>User page</div>
                <div title="Logout" onClick={() => session.doLogout()}>Log out</div>
              </div>
            </div>
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
