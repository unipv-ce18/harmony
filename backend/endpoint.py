from flask import Flask
from flask_restful import Resource, Api, reqparse
from flask_cors import CORS
from flask_pymongo import PyMongo
import security
from database import Database
from config import current_config

app = Flask(__name__)
CORS(app)

# load configs from json file
app.config.from_object(current_config)

# instance the backend as well as request parsers, jwt and connect to database
api = Api(app, prefix='/api/v1')
jwt = security.JWTManager(app)
mongo = PyMongo(app)
db = Database(mongo.db)


@jwt.token_in_blacklist_loader
def check_token_revoked(decrypted_token):
    return db.is_token_revoked(decrypted_token)


class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}


class AuthRegister(Resource):
    def post(self):
        data = authparser.parse_args()
        username = data['username']
        data['password'] = security.hash_password(data['password'])
        if db.check_username(username) is None:
            return 200 if db.add_user(data) else 401
        else:
            return {'error': 'user already exists'}, 401


class AuthLogin(Resource):
    def post(self):
        data = loginparser.parse_args()
        print(data)
        user = db.check_username(data['identity']) or db.check_email(data['identity'])
        if user is None:
            return 401
        else:
            if security.verify_password(user['password'], data['password']):
                access = security.create_access_token(identity=user['username'])
                refresh = security.create_refresh_token(identity=user['username'])
                db.store_token(security.decode_token(access))
                db.store_token(security.decode_token(refresh))
                return {'access-token': access, 'refresh-token': refresh}
            else:
                return 401


class AuthLogout(Resource):
    @security.jwt_required
    def post(self):
        _jwt = security.get_raw_jwt()
        if _jwt:
            db.revoke_token(_jwt['jti'])
            return 200
        return 401


class TokenRefresh(Resource):
    @security.jwt_refresh_token_required
    def post(self):
        user = security.get_jwt_identity()
        _jwt = security.get_raw_jwt()
        if _jwt:
            access_token = security.create_access_token(user)
            db.store_token(security.decode_token(access_token))
            return {'access-token': access_token}, 200
        return 401


# request parsers that automatically refuse requests without specified fields
authparser = reqparse.RequestParser()
authparser.add_argument('username', help='This field cannot be blank', required=True)
authparser.add_argument('password', help='This field cannot be blank', required=True)
authparser.add_argument('email', help="field required in registration form", required=True)
loginparser = authparser.copy()
loginparser.remove_argument('email')
loginparser.replace_argument('username', dest='identity')
# route API methods to their specific addresses (remember the prefix!)
api.add_resource(AuthRegister, '/auth/register')
api.add_resource(AuthLogin, '/auth/login')
api.add_resource(AuthLogout, '/auth/logout')
api.add_resource(TokenRefresh, '/auth/refresh')
api.add_resource(HelloWorld, '/sayhello')

if __name__ == '__main__':
    # set cron job to delete tokens after 1 day
    db.blacklist.create_index('exp', expireAfterSeconds=86400)
    # start the backend on specified address
    app.run(host='127.0.0.1', port=5000)
