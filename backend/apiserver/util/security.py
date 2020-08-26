import binascii
import hashlib
import os

# Expose jwt methods from this module
# noinspection PyUnresolvedReferences
from flask_jwt_extended import decode_token, get_raw_jwt, get_jwt_identity, \
    jwt_required, jwt_refresh_token_required, create_access_token, create_refresh_token


# encrypt salt+password to avoid duplicate entries of the same password
def hash_password(password):
    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    return (salt + pwdhash).decode('ascii')


# remove salt (first 64 bytes) and compare passwords
def verify_password(stored_password, provided_password):
    salt = stored_password[:64]
    stored_password = stored_password[64:]
    pwdhash = hashlib.pbkdf2_hmac('sha512', provided_password.encode('utf-8'), salt.encode('ascii'), 100000)
    pwdhash = binascii.hexlify(pwdhash).decode('ascii')
    return pwdhash == stored_password


# Verifies the given JWT token
# This function is required since flask_jwt_extended attempts extraction from the request by itself
# (headers, query param, ...), which is not what we want when using WebSockets/socket.io
def verify_jwt_token(encoded_token, token_type):
    from flask_jwt_extended.exceptions import NoAuthorizationError, UserLoadError
    from flask_jwt_extended import utils as jwt_utils
    from flask_jwt_extended.config import config as jwt_config

    if encoded_token is None:
        raise NoAuthorizationError('Missing "access_token" query parameter')

    token_data = decode_token(encoded_token)
    jwt_utils.verify_token_type(token_data, expected_type=token_type)
    jwt_utils.verify_token_not_blacklisted(token_data, token_type)
    jwt_utils.verify_token_claims(token_data)

    identity = token_data[jwt_config.identity_claim_key]
    if jwt_utils.has_user_loader():
        user = jwt_utils.user_loader(identity)
        if user is None:
            raise UserLoadError("user_loader returned None for {}".format(identity))


def get_user_token(encoded_token, token_type):
    from flask_jwt_extended.exceptions import NoAuthorizationError, UserLoadError
    from flask_jwt_extended import utils as jwt_utils
    from flask_jwt_extended.config import config as jwt_config

    if encoded_token is None:
        raise NoAuthorizationError('Missing "access_token" query parameter')

    token_data = decode_token(encoded_token)
    jwt_utils.verify_token_type(token_data, expected_type=token_type)
    jwt_utils.verify_token_not_blacklisted(token_data, token_type)
    jwt_utils.verify_token_claims(token_data)

    return token_data[jwt_config.identity_claim_key]
