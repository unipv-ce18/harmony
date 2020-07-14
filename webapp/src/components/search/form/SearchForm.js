import {Component} from 'preact';

import ModInput, {MODIFIER_START_CHAR} from './ModInput';
import {classList} from '../../../core/utils';
import {SEARCH_MODIFIERS} from './filters';

import style from './SearchForm.scss';
import {isQueryEmpty, routeSearch} from '../queryParams';

const INPUT_SEARCH_DELAY = 500;

class SearchForm extends Component {

  state = {
    hintVisible: true
  }

  #searchTimeout = null;

  constructor() {
    super();
    this.onInputChange = this.onInputChange.bind(this);
    this.onInputEnter = this.onInputEnter.bind(this);
  }

  render(_, {hintVisible}) {
    return (
      <div class={style.main}>
        <div class={classList(style.hintFrame, !hintVisible && 'hidden')}>
          <span>{`Search ${APP_NAME}...`}</span>
          <span>Start with an hyphen to trigger advanced search</span>
        </div>
        <ModInput modTypes={SEARCH_MODIFIERS} onChange={this.onInputChange} onEnter={this.onInputEnter}/>
      </div>
    )
  }

  onInputChange({text, modifiers}) {
    this.#searchTimeout && clearTimeout(this.#searchTimeout);
    this.#searchTimeout = null;

    const queryEmpty = isQueryEmpty(text, modifiers);
    this.setState({hintVisible: queryEmpty});

    // Will trigger search if query not empty and not waiting to insert a modifier
    if (!queryEmpty && text !== MODIFIER_START_CHAR)
      this.#searchTimeout = setTimeout(() => routeSearch(text, modifiers), INPUT_SEARCH_DELAY);
  }

  onInputEnter({text, modifiers}) {
    this.#searchTimeout && clearTimeout(this.#searchTimeout);
    this.#searchTimeout = null;

    routeSearch(text, modifiers);
  }

}


export default SearchForm;
