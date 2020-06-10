from http import HTTPStatus

from flask import current_app
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
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

        if db.get_user_by_mail(email) is None:
            if db.get_user_by_name(username) is None:
                data['password'] = security.hash_password(data['password'])
                data['type'] = 'basic'
                data['tier'] = 'free'
                data['prefs'] = {}
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
                example: {'access_token': 'ACCESS_TOKEN', 'refresh_token': 'REFRESH_TOKEN', 'token_type': 'bearer', 'access_expires_in': 900, 'refresh_expires_in': ‭2592000‬}
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
            user = db.get_user_by_name(data['identity']).to_dict() or db.get_user_by_mail(data['identity']).to_dict()

        if user is not None:
            if security.verify_password(user['password'], data['password']):
                access = security.create_access_token(identity=str(user['id']))
                refresh = security.create_refresh_token(identity=str(user['id']))
                db.store_token(security.decode_token(access))
                db.store_token(security.decode_token(refresh))
                return {
                    'access_token': access,
                    'refresh_token': refresh,
                    'token_type': 'bearer',
                    'access_expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
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
