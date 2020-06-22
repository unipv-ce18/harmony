import {Component} from 'preact';
import PropTypes from 'prop-types';

import {session} from '../../Harmony';
import {FieldType, validateEmail, validatePassword, validateUsername, ValidationError} from './validation';

import style from './LoginForm.scss';
import {ApiError, execRegistration} from '../../core/apiCalls';

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

  render({registration}) {
    const FormField = this.FormField;

    const vars = registration ? {
      formClass: style.registrationForm,
      submitHandler: this.handleSubmitRegister,
      submitLabel: 'Sign Up',
      switchHint: (<p className={style.regLink}>Are you already registered? <a href="/login">Login</a> now</p>)
    } : {
      formClass: style.loginForm,
      submitHandler: this.handleSubmitLogin,
      submitLabel: 'Login',
      switchHint: (<p className={style.regLink}>Not yet registered? <a href="/signup">Sign Up</a> now</p>)
    };

    return (
      <div className={style.formWrapper}>
        <form className={`${style.form} ${vars.formClass}`} onSubmit={vars.submitHandler}>
          <div>
            {registration && <FormField fieldType={FieldType.EMAIL} name="fieldEmail" placeholder="Email"/>}
            <FormField fieldType={FieldType.USERNAME} name="fieldUsername" placeholder="Username"/>
            <FormField fieldType={FieldType.PASSWORD_1} name="fieldPassword1" placeholder="Password"/>
            {registration && <FormField fieldType={FieldType.PASSWORD_2} name="fieldPassword2" placeholder="Repeat Password"/>}
          </div>
          <div>
            {!registration && [<input type="checkbox"/>, <label>Remember me</label>]}
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

  FormField = ({fieldType, placeholder, name, ...props}) => {
    const ERROR_STYLE = `border: 1px solid #bf0000`;

    const errorType = this.state.error && this.state.error.type;
    const isPassword = fieldType === FieldType.PASSWORD_1 || fieldType === FieldType.PASSWORD_2;

    return (
      <span>
        <input type={isPassword ? "password" : "text"} placeholder={placeholder} name={name}
               onChange={this.handleChange} onFocus={this.handleFocus} {...props}
               style={errorType === fieldType && ERROR_STYLE}/>
        {errorType === fieldType && (
          <div class={style.errorField}><span/>{this.state.error.message}</div>
        )}
    </span>
    )
  }

}

export default LoginForm;
