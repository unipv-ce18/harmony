import hashlib, binascii, os
import utils, jwt, datetime
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_claims


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


# jwt access token, 60s expire time
def encode_token(user_id):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0, seconds=60),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(payload, utils.config["secret_key"], algorithm="HS256"), payload['exp']


# decode jwt access token to check if a user is legit
def decode_token(token):
    try:
        payload = jwt.decode(token, utils.config["secret_key"])
        return payload
    except jwt.ExpiredSignatureError:
        # token expired
        return False
    except jwt.InvalidTokenError:
        # invalid token
        return True
