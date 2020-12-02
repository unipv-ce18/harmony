import {Component, createRef} from 'preact';

import ModInput, {MODIFIER_START_CHAR, ModValueTypes} from './ModInput';
import {classList} from '../../../core/utils';
import {SEARCH_MODIFIERS} from './filters';
import {fromSearchQuery, isQueryEmpty} from '../../../core/searchQuery';
import routeSearch from '../routeSearch';

import style from './SearchForm.scss';

const INPUT_SEARCH_DELAY = 500;

class SearchForm extends Component {

  state = {
    hintVisible: true,
    popupVisible: false
  }

  #input = createRef();
  #searchTimeout = null;
  #lastQuery = null;  // To debounce input.loadData

  constructor() {
    super();
    this.onInputChange = this.onInputChange.bind(this);
    this.onInputEnter = this.onInputEnter.bind(this);
  }

  componentWillUpdate(nextProps, nextState, nextContext) {
    // Restore state from header if we landed on search page
    const [_, search, query] = window.location.pathname.split('/', 3);
    if (search === 'search' && query !== this.#lastQuery) {
      this.#lastQuery = query;
      const queryData = fromSearchQuery(query);
      this.#input.current.loadData(queryData);
      this.setState({hintVisible: isQueryEmpty(queryData)});
    }
  }

  render(_, {hintVisible, popupVisible}) {
    return (
      <div class={classList(style.main, popupVisible && 'popupVisible')}>
        <EmptyHint visible={hintVisible}/>
        <ModInput ref={this.#input} modTypes={SEARCH_MODIFIERS}
                  onChange={this.onInputChange} onEnter={this.onInputEnter}/>
        <PopupLegend onElementClick={modifier => {
          this.#input.current.handleChangeValue({target: {value: `-${modifier.input} `}});
          // Focus back main input from click if modifier has no "autofocus" value"
          if (modifier.valueType === ModValueTypes.NONE) this.#input.current.inputRef.current.focus();
        }}/>
      </div>
    )
  }

  onInputChange({text, modifiers}) {
    this.#searchTimeout && clearTimeout(this.#searchTimeout);
    this.#searchTimeout = null;

    const queryEmpty = isQueryEmpty({text, modifiers});
    this.setState({hintVisible: queryEmpty, popupVisible: text === MODIFIER_START_CHAR});

    // Will trigger search if query not empty and not waiting to insert a modifier
    if (!queryEmpty && !text.startsWith(MODIFIER_START_CHAR))
      this.#searchTimeout = setTimeout(() => routeSearch(text, modifiers), INPUT_SEARCH_DELAY);
  }

  onInputEnter({text, modifiers}) {
    this.#searchTimeout && clearTimeout(this.#searchTimeout);
    this.#searchTimeout = null;

    routeSearch(text, modifiers);
  }

}

const EmptyHint = ({visible}) => (
  <div className={classList(style.hintFrame, !visible && 'hidden')}>
    <span>Search for music...</span>
    <span>Start with an hyphen to trigger advanced search</span>
  </div>
)

const PopupLegend = ({onElementClick}) => (
  <div className={style.popup}>
    <table>
      {SEARCH_MODIFIERS.map(m => (
        <tr style={{'--mod-color': m.color}} onClick={onElementClick.bind(null, m)}>
          <td>-{m.input}</td>
          <td>{m.description}</td>
        </tr>
      ))}
    </table>
  </div>
);

export default SearchForm;
