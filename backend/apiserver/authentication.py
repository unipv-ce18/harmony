from flask_restful import Resource, reqparse

from . import security


# request parsers that automatically refuse requests without specified fields
authparser = reqparse.RequestParser()
authparser.add_argument('username', help='This field cannot be blank', required=True)
authparser.add_argument('password', help='This field cannot be blank', required=True)
authparser.add_argument('email', help='field required in registration form', required=True)
loginparser = authparser.copy()
loginparser.remove_argument('email')
loginparser.replace_argument('username', dest='identity')


class AuthRegister(Resource):
    def __init__(self, db):
        self.db = db

    def post(self):
        data = authparser.parse_args()
        username = data['username']
        email = data['email']
        data['password'] = security.hash_password(data['password'])

        if self.db.get_user_by_mail(email) is None:
            if self.db.get_user_by_name(username) is None:
                return 200 if self.db.add_user(data) else 401
            return {'message': 'Username already exists'}, 401
        return {'message': 'Email already exists'}, 401


class AuthLogin(Resource):
    def __init__(self, db):
        self.db = db

    def post(self):
        data = loginparser.parse_args()
        user = self.db.get_user_by_name(data['identity']) or self.db.get_user_by_mail(data['identity'])
        if user is not None:
            if security.verify_password(user['password'], data['password']):
                access = security.create_access_token(identity=user['username'])
                refresh = security.create_refresh_token(identity=user['username'])
                self.db.store_token(security.decode_token(access))
                self.db.store_token(security.decode_token(refresh))
                return {'access_token': access, 'refresh_token': refresh, 'token_type': 'bearer', 'expires_in': 900}
        return 401


class AuthLogout(Resource):
    def __init__(self, db):
        self.db = db

    @security.jwt_required
    def post(self):
        _jwt = security.get_raw_jwt()
        if _jwt:
            self.db.revoke_token(_jwt['jti'])
            return 200
        return 401


class TokenRefresh(Resource):
    def __init__(self, db):
        self.db = db
        
    @security.jwt_refresh_token_required
    def post(self):
        user = security.get_jwt_identity()
        _jwt = security.get_raw_jwt()
        if _jwt:
            access_token = security.create_access_token(user)
            self.db.store_token(security.decode_token(access_token))
            return {'access_token': access_token}, 200
        return 401
