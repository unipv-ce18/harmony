from bson import ObjectId

from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_restful import Resource, Api, reqparse

from common.database import Database
from . import security
from .config import current_config

app = Flask(__name__)
CORS(app)

# load configs from json file
app.config.from_object(current_config)

# instance the backend as well as request parsers, jwt and connect to database
api = Api(app, prefix='/api/v1')
jwt = security.JWTManager(app)
mongo = PyMongo(app,
                username=current_config.MONGO_USERNAME,
                password=current_config.MONGO_PASSWORD)
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
        email = data['email']
        data['password'] = security.hash_password(data['password'])
        if db.get_user_by_mail(email) is None:
            if db.get_user_by_name(username) is None:
                return 200 if db.add_user(data) else 401
            else:
                return {'message': 'Username already exists'}, 401
        else:
            return {'message': 'Email already exists'}, 401


class AuthLogin(Resource):
    def post(self):
        data = loginparser.parse_args()
        user = db.get_user_by_name(data['identity']) or db.get_user_by_mail(data['identity'])
        if user is None:
            return 401
        else:
            if security.verify_password(user['password'], data['password']):
                access = security.create_access_token(identity=user['username'])
                refresh = security.create_refresh_token(identity=user['username'])
                db.store_token(security.decode_token(access))
                db.store_token(security.decode_token(refresh))
                return {'access_token': access, 'refresh_token': refresh, 'token_type': 'bearer', 'expires_in': 900}
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
            return {'access_token': access_token}, 200
        return 401


class GetRelease(Resource):
    def get(self, id):
        if not ObjectId.is_valid(id):
            return 'Id not valid', 401

        data = reqparse.RequestParser().add_argument('songs').parse_args()
        include_songs = data['songs'] == '1'
        release = db.get_release(id, include_songs)

        if release is None:
            return 'No release', 401
        return release.to_dict(), 200


class GetArtist(Resource):
    def get(self, id):
        if not ObjectId.is_valid(id):
            return 'Id not valid', 401

        data = reqparse.RequestParser().add_argument('releases').parse_args()
        include_releases = data['releases'] == '1'
        artist = db.get_artist(id, include_releases)

        if artist is None:
            return 'No artist', 401
        return artist.to_dict(), 200


# request parsers that automatically refuse requests without specified fields
authparser = reqparse.RequestParser()
authparser.add_argument('username', help='This field cannot be blank', required=True)
authparser.add_argument('password', help='This field cannot be blank', required=True)
authparser.add_argument('email', help='field required in registration form', required=True)
loginparser = authparser.copy()
loginparser.remove_argument('email')
loginparser.replace_argument('username', dest='identity')
# route API methods to their specific addresses (remember the prefix!)
api.add_resource(AuthRegister, '/auth/register')
api.add_resource(AuthLogin, '/auth/login')
api.add_resource(AuthLogout, '/auth/logout')
api.add_resource(TokenRefresh, '/auth/refresh')
api.add_resource(GetRelease, '/release/<id>')
api.add_resource(GetArtist, '/artist/<id>')
api.add_resource(HelloWorld, '/sayhello')
