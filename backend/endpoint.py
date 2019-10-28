from flask import Flask
from flask_restful import Resource, Api
from flask_pymongo import PyMongo
import utils
import jwt

app = Flask(__name__)

# init some parameters: import secret key and database to app config
app.config["SECRET_KEY"] = bytes(utils.config["secret_key"], 'utf-8')
app.config["MONGO_URI"] = utils.config["database"]["uri"]
app.config['MONGO_USERNAME'] = utils.config["database"]["username"]
app.config['MONGO_PASSWORD'] = utils.config["database"]["password"]
# instance the backend, set API prefix (as documentation) and connect to database
api = Api(app, prefix="/api/v1")
mongo = PyMongo(app)


class HelloWorld(Resource):
    def get(self):
        # default 200 OK
        return {"hello": "world"}


class UserInfo(Resource):
    def get(self):
        return {"count": mongo.db.users.count()}


class AuthRegister(Resource):
    # todo: if user credentials are correct, generate a jwt token
    def post(self):
        return {"to": "do"}


class AuthLogin(Resource):
    # todo: check if user is registered, otherwise refuse him
    def post(self):
        return {"to": "do"}


class AuthLogout(Resource):
    # todo: validate and blacklist a token
    def post(self):
        return {"to": "do"}


# route API methods to their specific addresses (remember the prefix!)
api.add_resource(HelloWorld, "/")
api.add_resource(UserInfo, "/users")
api.add_resource(AuthRegister, "/auth/register")
api.add_resource(AuthLogin, "/auth/login")
api.add_resource(AuthLogout, "/auth/logout")

if __name__ == '__main__':
    # start the backend on specified address
    app.run(host='127.0.0.1:5000')
