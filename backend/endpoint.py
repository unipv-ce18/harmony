from flask import Flask
from flask_restful import Resource, Api, reqparse
from flask_pymongo import PyMongo
import security
from database.database import Database

app = Flask(__name__)

# load configs from json file
app.config.from_json("resources/config.json")

# instance the backend as well as request parsers, jwt and connect to database
api = Api(app, prefix="/api/v1")
jwt = security.JWTManager(app)
mongo = PyMongo(app)
authparser = reqparse.RequestParser()
db = Database(mongo.db)


class HelloWorld(Resource):
    def get(self):
        return {"hello": "world"}


class UserInfo(Resource):
    def get(self):
        return {"count": mongo.db.users.count()}


class AuthRegister(Resource):
    # todo: if user credentials are correct, generate a jwt token
    def post(self):
        data = authparser.parse_args()
        username = data["username"]
        data["password"] = security.hash_password(data["password"])
        if db.check_username(username) is None:
            return 200 if db.add_user(data) else 401
        else:
            return {"error": "user already exists"}, 401


class AuthLogin(Resource):
    # todo: check if user exists in db; if so, generate a valid token
    def post(self):
        data = authparser.parse_args()
        user = db.check_username(data["username"])
        if user is None:
            return 401
        else:
            access = security.create_access_token(identity=data["username"])
            refresh = security.create_refresh_token(identity=data["username"])
            return {"access-token": access, "refresh-token": refresh}, 200


class AuthLogout(Resource):
    # todo: validate user and blacklist his token
    def post(self):
        return {"to": "do"}


# request parsers that automatically refuse requests without specified fields
authparser.add_argument('username', help="This field cannot be blank", required=True)
authparser.add_argument('password', help='This field cannot be blank', required=True)
authparser.add_argument('email', help='This field cannot be blank', required=False)
# route API methods to their specific addresses (remember the prefix!)
api.add_resource(HelloWorld, "/")
api.add_resource(UserInfo, "/users")
api.add_resource(AuthRegister, "/auth/register")
api.add_resource(AuthLogin, "/auth/login")
api.add_resource(AuthLogout, "/auth/logout")

if __name__ == '__main__':
    # start the backend on specified address
    app.run(host='127.0.0.1:5000')
