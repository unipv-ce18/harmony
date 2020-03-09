from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint, prefix='/auth')

# Request parsers that automatically refuse requests without specified fields
_arg_parser_register = RequestParser()\
    .add_argument('username', help='This field cannot be blank', required=True)\
    .add_argument('password', help='This field cannot be blank', required=True)\
    .add_argument('email', help='field required in registration form', required=True)
_arg_parser_login = _arg_parser_register.copy()\
    .remove_argument('email')\
    .replace_argument('username', dest='identity')


@api.resource('/register')
class AuthRegister(Resource):
    def post(self):
        data = _arg_parser_register.parse_args()
        username = data['username']
        email = data['email']
        data['password'] = security.hash_password(data['password'])

        if db.get_user_by_mail(email) is None:
            if db.get_user_by_name(username) is None:
                return 200 if db.add_user(data) else 401
            return {'message': 'Username already exists'}, 401
        return {'message': 'Email already exists'}, 401


@api.resource('/login')
class AuthLogin(Resource):
    def post(self):
        data = _arg_parser_login.parse_args()
        user = db.get_user_by_name(data['identity']) or db.get_user_by_mail(data['identity'])
        if user is not None:
            if security.verify_password(user['password'], data['password']):
                access = security.create_access_token(identity=user['username'])
                refresh = security.create_refresh_token(identity=user['username'])
                db.store_token(security.decode_token(access))
                db.store_token(security.decode_token(refresh))
                return {'access_token': access, 'refresh_token': refresh, 'token_type': 'bearer', 'expires_in': 900}
        return 401


@api.resource('/logout')
class AuthLogout(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        _jwt = security.get_raw_jwt()
        if _jwt:
            db.revoke_token(_jwt['jti'])
            return 200
        return 401


@api.resource('/refresh')
class TokenRefresh(Resource):
    method_decorators = [security.jwt_refresh_token_required]

    def post(self):
        user = security.get_jwt_identity()
        _jwt = security.get_raw_jwt()
        if _jwt:
            access_token = security.create_access_token(user)
            db.store_token(security.decode_token(access_token))
            return {'access_token': access_token}, 200
        return 401
