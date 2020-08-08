import {Component, createRef} from 'preact';
import PropTypes from 'prop-types';

import style from './ModInput.scss';

export const ModValueTypes = Object.freeze({
  NONE: 'none', WORD: 'word', STRING: 'string'
});


export const MODIFIER_START_CHAR = '-';
const CHIP_COLOR_ALPHA = '.4';

/**
 * An input field with allows for modifier "chips" to be inserted on certain keywords
 */
class ModInput extends Component {

  static propTypes = {
    /** Modifiers that are allowed */
    modTypes: PropTypes.array.isRequired,
    /** Function to be called when input data changes */
    onChange: PropTypes.func,
    /** Called when the Enter key is pressed when the form is focused */
    onEnter: PropTypes.func
  }

  state = {
    text: '',
    modifiers: []
  }

  inputRef = createRef();
  lastModId = 0;

  constructor() {
    super();
    this.handleChangeValue = this.handleChangeValue.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  render({modTypes}, {modifiers, text}, context) {
    return (
      <div class={style.modInput}>
        {modifiers.map(({key, id, value}) =>
          <ModChip key={id} id={id} type={modTypes.find(e => e.key === key)} value={value} parent={this}/>)}
        <input ref={this.inputRef} class={style.inputField} type="text" value={text}
               onChange={this.handleChangeValue} onKeyDown={this.handleKeyDown}/>
      </div>
    )
  }

  handleChangeValue(event) {
    const {text, modifier} = this.#findModifier(event.target.value);
    this.#update({text, ...(modifier != null && {modifiers: [...this.state.modifiers, modifier]})});
  }

  handleKeyDown(e) {
    const {text, modifiers} = this.state;

    switch (e.code) {
      case 'Backspace':
        // If no text or caret at start of input, remove last modifier in array
        if (text === '' || (this.inputRef.current.selectionStart === 0 && this.inputRef.current.selectionEnd === 0)) {
          this.#update({modifiers: modifiers.slice(0, -1)}, () => this.inputRef.current.focus());
          e.preventDefault();
        }
        break;

      case 'Enter':
        this.props.onEnter && this.props.onEnter(this.state);
        break;
    }
  }

  removeModifier(id) {
    const modifiers = this.state.modifiers;
    modifiers.splice(modifiers.findIndex(m => m.id === id), 1);
    this.#update({modifiers}, () => this.inputRef.current.focus());
  }

  updateModifierValue(id, value) {
    this.#update({modifiers: this.state.modifiers.map(m => m.id === id ? {...m, value} : m)});
  }

  /**
   * Load this input state from external data
   */
  loadData({text, modifiers}) {
    this.setState({text, modifiers: modifiers.map(m => ({...m, id: ++this.lastModId}))})
  }

  #findModifier(text) {
    if (text[0] !== MODIFIER_START_CHAR) return {text, modifier: null};    // Check if text starts with '-'

    const [modWord, ...rest] = text.split(' ');
    if (rest.length === 0) return {text, modifier: null};  // Abort if no space after modifier keyword

    const modInput = modWord.substr(1);  // Strip initial '-' in first "word"
    const modType = this.props.modTypes.find(m => m.input === modInput);

    if (modType === undefined) return {text, modifier: null};  // No modifier for input sequence

    return {text: rest.join(' '), modifier: {key: modType.key, id: ++this.lastModId}};
  }

  #update(state, callback) {
    super.setState(state, () => {
      this.props.onChange && this.props.onChange(this.state);
      return callback && callback();
    });
  }

}

/**
 * A modifier chip to be displayed in the main input
 */
class ModChip extends Component {

  modInputRef = createRef();

  constructor() {
    super();
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    // To start editing its value when the modifier chip appears
    if (this.props.type.valueType !== ModValueTypes.NONE) this.modInputRef.current.focus();
  }

  render({type, id, parent, value}) {
    const len = 1 + (this.modInputRef.current ? this.modInputRef.current.value.length : 0);
    return (
      <div class={style.chip} title={type.description}
           style={type.color && {backgroundColor: `rgba(${type.color},${CHIP_COLOR_ALPHA})`}}>
        <span onClick={() => parent.removeModifier(id)}>{type.displayName}</span>
        {type.valueType !== ModValueTypes.NONE && (
          <input ref={this.modInputRef} type="text" style={{width: `${7 * len}px`}} value={value}
                 onChange={e => parent.updateModifierValue(id, e.target.value)} onKeyDown={this.handleKeyDown}/>
        )}
      </div>
    )
  }

  handleKeyDown(e) {
    const parent = this.props.parent;

    switch (e.code) {
      case 'Space':
        if (this.props.type.valueType === ModValueTypes.WORD) {
          parent.inputRef.current.focus();
          e.preventDefault();
        }
        break;

      case 'ArrowRight':
        if (this.modInputRef.current.selectionStart === this.modInputRef.current.value.length) {
          parent.inputRef.current.focus();
          parent.inputRef.current.selectionStart = 0;
          e.preventDefault();
        }
        break;

      case 'Backspace':
        if (this.modInputRef.current.value.length === 0) {
          parent.removeModifier(this.props.id);
          parent.inputRef.current.focus();
          parent.inputRef.current.selectionStart = 0;
          e.preventDefault();
        }
        break;

      case 'Enter':
        parent.props.onEnter && parent.props.onEnter(parent.state);
        break;
    }
  }

}


export default ModInput;
