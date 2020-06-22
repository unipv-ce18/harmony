import {Component} from 'preact';
import PropTypes from 'prop-types';
import TransitionGroup from 'preact-transition-group';

import {session} from '../../Harmony';
import {FieldType, validateEmail, validatePassword, validateUsername, ValidationError} from './validation';
import {ApiError, execRegistration} from '../../core/apiCalls';

import style from './LoginForm.scss';

const TRANSITION_LEN = parseInt(style.formTransitionLen);
const FIELD_MARGIN_REGISTRATION = parseInt(style.fieldMarginRegistration)

class LoginForm extends Component {

  static propTypes = {
    /** Whether to display a registration form */
    registration: PropTypes.bool
  }

  state = {
    fieldEmail: "",
    fieldUsername: "",
    fieldPassword1: "",
    fieldPassword2: "",
    error: null
  };

  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleSubmitLogin = this.handleSubmitLogin.bind(this);
    this.handleSubmitRegister = this.handleSubmitRegister.bind(this);
  }

  handleChange(e) {
    this.setState({[e.target.name]: e.target.value})
  }

  handleFocus() {
    this.setState({error: null})
  }

  handleSubmitLogin(e) {
    e.preventDefault();
    try {
      const {fieldUsername, fieldPassword1} = this.state;
      validateUsername(fieldUsername);
      validatePassword(fieldPassword1);

      session.doLogin(fieldUsername, fieldPassword1)
        .catch(e => alert('Login failed'));

    } catch (e) {
      this.setState({error: e});
    }
  }

  handleSubmitRegister(e) {
    e.preventDefault();
    try {
      const {fieldEmail, fieldUsername, fieldPassword1, fieldPassword2} = this.state;
      validateEmail(fieldEmail);
      validateUsername(fieldUsername);
      validatePassword(fieldPassword1, fieldPassword2);

      execRegistration(fieldEmail, fieldUsername, fieldPassword1)
        .then(_ => session.doLogin(fieldUsername, fieldPassword1))
        .catch(e => {
          if (e instanceof ApiError)
            e.response.json().then(d => this.#processServerError(d));
          else
            this.#processServerError({message: `Generic server error: ${e.message}`});
        });

    } catch (e) {
      this.setState({error: e});
    }
  }

  render({registration}, {error}) {
    const vars = registration ? {
      formClass: style.registrationForm,
      submitHandler: this.handleSubmitRegister,
      submitLabel: 'Sign Up',
      switchHint: (<p className={style.regLink}>Already have an account? <a href="/login">Login</a> now</p>)
    } : {
      formClass: style.loginForm,
      submitHandler: this.handleSubmitLogin,
      submitLabel: 'Login',
      switchHint: (<p className={style.regLink}>Not yet registered? <a href="/signup">Sign Up</a> now</p>)
    };

    const commonProps = {error, onChange: this.handleChange, onFocus: this.handleFocus}

    return (
      <div className={style.formWrapper}>
        <form className={`${style.form} ${vars.formClass}`} onSubmit={vars.submitHandler}>
          <TransitionGroup component="div">
            {registration && (
              <FormField key="e" fieldType={FieldType.EMAIL} name="fieldEmail" placeholder="Email" {...commonProps}/>
            )}
            <FormField key="u" fieldType={FieldType.USERNAME} name="fieldUsername" placeholder="Username" {...commonProps}/>
            <FormField key="p1" fieldType={FieldType.PASSWORD_1} name="fieldPassword1" placeholder="Password" {...commonProps}/>
            {registration && (
              <FormField key="p2" fieldType={FieldType.PASSWORD_2} name="fieldPassword2" placeholder="Repeat Password" {...commonProps}/>
            )}
          </TransitionGroup>
          <div>
            <div class={style.rememberMe}>
              <input type="checkbox"/>
              <label>Remember me</label>
            </div>
            <input type="submit" value={vars.submitLabel}/>
          </div>
        </form>
        {vars.switchHint}
      </div>
    );
  }

  #processServerError({message}) {
    switch (message) {
      case 'Username already exists':
        this.setState({error: new ValidationError(FieldType.USERNAME, message)});
        break;
      case 'Email already exists':
        this.setState({error: new ValidationError(FieldType.EMAIL, message)});
        break;
      default:
        // We may want to display this in a better way
        alert(message)
    }
  }

}

class FormField extends Component {

  static ERROR_STYLE = `border: 1px solid #bf0000`;
  static ANIMATION_OPTIONS = {duration: TRANSITION_LEN, easing: 'ease'};

  componentWillEnter(done) {
    const h = (this.base.children[0].clientHeight + FIELD_MARGIN_REGISTRATION) + 'px';
    this.base.animate([{height: '0', opacity: '0'}, {height: h, opacity: '1'}], FormField.ANIMATION_OPTIONS).onfinish = done;
  }

  componentWillLeave(done) {
    const h = this.base.clientHeight + 'px';
    this.base.animate([{height: h, opacity: '1'}, {height: '0', opacity: '0'}], FormField.ANIMATION_OPTIONS).onfinish = done;
  }

  render({fieldType, placeholder, name, error, onChange, onFocus, ...props}) {

    const errorType = error && error.type;
    const isPassword = fieldType === FieldType.PASSWORD_1 || fieldType === FieldType.PASSWORD_2;

    return (
      <div class={style.fieldWrapper}>
        <input type={isPassword ? "password" : "text"} placeholder={placeholder} name={name}
               onChange={onChange} onFocus={onFocus} {...props}
               style={errorType === fieldType && FormField.ERROR_STYLE}/>
        {errorType === fieldType && (
          <div class={style.errorField}><span/>{error.message}</div>
        )}
      </div>
    );
  }

}

export default LoginForm;
