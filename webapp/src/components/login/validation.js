const EMAIL_MATCHER = /^[a-zA-Z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const USERNAME_MATCHER = /^[a-zA-Z1-9]{1,20}$/;
const PASSWORD_MATCHER = /^[a-zA-Z0-9!$%@]{5,25}$/;


export const FieldType = Object.freeze({
  EMAIL: 'email', USERNAME: 'username', PASSWORD_1: 'pass1', PASSWORD_2: 'pass2'
});

export class ValidationError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
  }
}

export function validateEmail(email) {
  if (email === "")
    throw new ValidationError(FieldType.EMAIL, 'This field cannot be empty');
  if (!email.match(EMAIL_MATCHER))
    throw new ValidationError(FieldType.EMAIL, 'Email not valid');
}

export function validateUsername(username) {
  if (username === "")
    throw new ValidationError(FieldType.USERNAME, 'This field cannot be empty');
  if (!username.match(USERNAME_MATCHER))
    throw new ValidationError(FieldType.USERNAME, 'The username contains invalid characters');
}

export function validatePassword(pass1, pass2) {
  if (pass1 === "")
    throw new ValidationError(FieldType.PASSWORD_1, 'This field cannot be empty');
  if (!pass1.match(PASSWORD_MATCHER))
    throw new ValidationError(FieldType.PASSWORD_1, 'The password contains invalid characters');

  if (pass2 == null) return;

  if (pass2 === "")
    throw new ValidationError(FieldType.PASSWORD_2, 'This field cannot be empty');
  if (pass2 !== pass1)
    throw new ValidationError(FieldType.PASSWORD_2, 'Passwords do not match');
}
