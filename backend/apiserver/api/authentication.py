from http import HTTPStatus
import re

from flask import current_app
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.contracts import user_contract as c
from common.database.codecs import user_from_document


api = Api(api_blueprint, prefix='/auth')

# Request parsers that automatically refuse requests without specified fields
_arg_parser_register = RequestParser()\
    .add_argument('username', help='This field cannot be blank', required=True)\
    .add_argument('email', help='This field cannot be blank', required=True)\
    .add_argument('password', help='This field cannot be blank', required=True)
_arg_parser_login = RequestParser()\
    .add_argument('identity', help='Required, can be either username or email', required=True)\
    .add_argument('password', help='This field cannot be blank', required=True)


EMAIL_VALIDATION = '^[a-zA-Z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$'
USERNAME_VALIDATION = '^[a-zA-Z1-9]{1,20}$'
PASSWORD_VALIDATION = '^[a-zA-Z0-9!$%@]{5,25}$'


@api.resource('/register')
class AuthRegister(Resource):

    def post(self):
        """Registers a new user
        ---
        tags: [auth]
        security: []
        requestBody:
          description: User to add to the system
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  username: {type: string, description: The desired nickname}
                  email: {type: string, description: The user's email address}
                  password: {type: string, format: password, description: The password}
                required: [username, email, password]
              examples:
                0: {summary: 'New user', value: {'username': 'LordReason', 'email': 'lord@fuck.me', 'password': 'allshallperish'}}
        responses:
          201:
            description: A new user is created
            content:
              application/json:
                example: {'message': 'User created'}
          400:
            description: Value not valid
            content:
              application/json:
                examples:
                  0-username: {summary: 'Not valid username', value: {'message': 'Username not valid'}}
                  1-mail: {summary: 'Not valid email address', value: {'message': 'Email not valid'}}
                  2-password: {summary: 'Not valid password', value: {'message': 'Password not valid'}}
          409:
            description: A matching user already exists
            content:
              application/json:
                examples:
                  0-name: {summary: 'Conflicting username', value: {'message': 'Username already exists'}}
                  1-mail: {summary: 'Conflicting email address', value: {'message': 'Email already exists'}}
        """
        data = _arg_parser_register.parse_args()
        username = data['username']
        email = data['email']

        if not re.search(EMAIL_VALIDATION, email):
            return {'message': 'Email not valid'}, HTTPStatus.BAD_REQUEST
        if not re.search(USERNAME_VALIDATION, username):
            return {'message': 'Username not valid'}, HTTPStatus.BAD_REQUEST
        if not re.search(PASSWORD_VALIDATION, data['password']):
            return {'message': 'Password not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_user_by_mail(email) is None:
            if db.get_user_by_name(username) is None:
                data['password'] = security.hash_password(data['password'])
                data[c.USER_TYPE] = c.USER_TYPE_BASIC
                data[c.USER_TIER] = c.USER_TIER_FREE
                data[c.USER_LIBRARY] = {}
                data[c.USER_PREFS] = {'private': {'email': False}}
                if db.put_user(user_from_document(data)):
                    return {'message': 'User created'}, HTTPStatus.CREATED
                else:
                    return {'message': 'Failed to create new user'}, HTTPStatus.INTERNAL_SERVER_ERROR
            return {'message': 'Username already exists'}, HTTPStatus.CONFLICT
        return {'message': 'Email already exists'}, HTTPStatus.CONFLICT


@api.resource('/login')
class AuthLogin(Resource):

    def post(self):
        """Logs in to the system
        ---
        tags: [auth]
        security: []
        requestBody:
          description: User credentials
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  identity: {type: string, description: The user's nickname or email address}
                  password: {type: string, format: password, description: The password used for authentication}
                required: [identity, password]
              examples:
                0: {summary: 'Logging in', value: {'identity': 'Boris', 'password': 'amerika'}}
        responses:
          200:
            description: Successful login
            content:
              application/json:
                example: {'access_token': 'ACCESS_TOKEN', 'refresh_token': 'REFRESH_TOKEN', 'token_type': 'bearer', 'expires_in': 900, 'refresh_expires_in': ‭2592000‬}
          401:
            description: Login has failed
            content:
              application/json:
                example: {'message': 'Bad credentials'}
        """
        data = _arg_parser_login.parse_args()

        # Bypass registration and login in testing environment
        if current_app.config['TESTING'] and data['identity'] == 'test':
            from bson import ObjectId
            user = {'id': ObjectId(), 'password': security.hash_password(data['password'])}
        else:
            user = db.get_user_by_name(data['identity']) or db.get_user_by_mail(data['identity'])

        if user is not None:
            user = user if isinstance(user, dict) else user.to_dict()
            if security.verify_password(user['password'], data['password']):
                access = security.create_access_token(identity=str(user['id']))
                refresh = security.create_refresh_token(identity=str(user['id']))
                db.store_token(security.decode_token(access))
                db.store_token(security.decode_token(refresh))
                return {
                    'access_token': access,
                    'refresh_token': refresh,
                    'token_type': 'bearer',
                    'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
                    'refresh_expires_in': current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
                }
        return {'message': 'Bad credentials'}, HTTPStatus.UNAUTHORIZED


@api.resource('/logout')
class AuthLogout(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Logs out the user
        ---
        tags: [auth]
        security: [accessToken: []]
        responses:
          200:
            description: Successful logout
            content:
              application/json:
                example: {'message': 'Logged out'}
          401:
            description: Missing token
            content:
              application/json:
                example: {'message': 'Missing access token'}
        """
        _jwt = security.get_raw_jwt()
        if _jwt:
            db.revoke_token(_jwt['identity'])
            return {'message': 'Logged out'}
        return {'message': 'Missing access token'}, HTTPStatus.UNAUTHORIZED


@api.resource('/refresh')
class TokenRefresh(Resource):
    method_decorators = [security.jwt_refresh_token_required]

    def post(self):
        """Requests a new access token
        ---
        tags: [auth]
        security: [refreshToken: []]
        responses:
          200:
            description: New access token
            content:
              application/json:
                example: {'access_token': 'ACCESS_TOKEN', 'expires_in': 900}
          401:
            description: Missing token
            content:
              application/json:
                example: {'message': 'Missing refresh token'}
        """
        user = security.get_jwt_identity()
        _jwt = security.get_raw_jwt()
        if _jwt:
            access_token = security.create_access_token(user)
            db.store_token(security.decode_token(access_token))
            return {'access_token': access_token, 'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']}
        return {'message': 'Missing refresh token'}, HTTPStatus.UNAUTHORIZED
