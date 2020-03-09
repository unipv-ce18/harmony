import logging
import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo
from flask_socketio import SocketIO

from common import config_rabbitmq
from common.database import Database
from .config import config
from .ws.playback_namespace import PlaybackNamespace
from .ws.transcoder_client import TranscoderClient


# Flask extensions
cors = CORS()
jwt = JWTManager()
pymongo = PyMongo()
socketio = SocketIO()


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Configure logging for application modules
    if config[config_name].DEBUG:
        logging.getLogger('common').setLevel(logging.DEBUG)
        logging.getLogger('apiserver').setLevel(logging.DEBUG)

    # Apply extensions
    cors.init_app(app)
    jwt.init_app(app)
    pymongo.init_app(app,
                     username=config[config_name].MONGO_USERNAME,
                     password=config[config_name].MONGO_PASSWORD)
    socketio.init_app(app)

    db = Database(pymongo.db)

    @jwt.token_in_blacklist_loader
    def check_token_revoked(decrypted_token):
        return db.is_token_revoked(decrypted_token)

    # Register API routes
    from .api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api/v1', db=db)

    # Configure WebSocket
    transcoder_client = TranscoderClient(config_rabbitmq)
    socketio.on_namespace(PlaybackNamespace('/playback', socketio, transcoder_client))

    return app
