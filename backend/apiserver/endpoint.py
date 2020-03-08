from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_restful import Api
from flask_socketio import SocketIO

from common.database import Database
from . import security
from .config import current_config
from .authentication import AuthRegister, AuthLogin, AuthLogout, TokenRefresh
from .retrieve_info import GetRelease, GetArtist
from .transcoder_producer import TranscoderProducer
from .transcode_namespace import TranscodeNamespace


def create_app():
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

    socketio = SocketIO(app)#, message_queue='amqp://guest:guest@localhost:5672')

    producer = TranscoderProducer()
    queue = producer.get_queue()

    @jwt.token_in_blacklist_loader
    def check_token_revoked(decrypted_token):
        return db.is_token_revoked(decrypted_token)

    # route API methods to their specific addresses (remember the prefix!)
    api.add_resource(AuthRegister, '/auth/register', resource_class_kwargs={'db': db})
    api.add_resource(AuthLogin, '/auth/login', resource_class_kwargs={'db': db})
    api.add_resource(AuthLogout, '/auth/logout', resource_class_kwargs={'db': db})
    api.add_resource(TokenRefresh, '/auth/refresh', resource_class_kwargs={'db': db})
    api.add_resource(GetRelease, '/release/<id>', resource_class_kwargs={'db': db})
    api.add_resource(GetArtist, '/artist/<id>', resource_class_kwargs={'db': db})

    socketio.on_namespace(TranscodeNamespace(socketio=socketio, producer=producer, queue=queue))

    return app, socketio
