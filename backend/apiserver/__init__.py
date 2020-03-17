import logging
import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo
from flask_socketio import SocketIO

from common import log_util
from common.database import Database
from .config import config
from .ws.playback_namespace import PlaybackNamespace
from .ws.transcoder_client import TranscoderClient


# Flask extensions
cors = CORS()
jwt = JWTManager()
pymongo = PyMongo()
socketio = SocketIO(cors_allowed_origins='*')


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'development')

    current_config = config[config_name]

    app = Flask(__name__)
    app.config.from_object(current_config)

    # Configure logging for application modules
    log_util.configure_logging(__package__, logging.DEBUG if current_config.DEBUG else None)
    if 'gunicorn' in os.environ.get('SERVER_SOFTWARE', ''):
        logging.getLogger().handlers = logging.getLogger('gunicorn.error').handlers

    # Apply extensions
    cors.init_app(app)
    jwt.init_app(app)
    pymongo.init_app(app,
                     username=current_config.MONGO_USERNAME,
                     password=current_config.MONGO_PASSWORD)
    socketio.init_app(app)

    db = Database(pymongo.db)

    @jwt.token_in_blacklist_loader
    def check_token_revoked(decrypted_token):
        return db.is_token_revoked(decrypted_token)

    # Register API routes
    from .api import api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api/v1', db=db)

    # Configure messaging (skip if Werkzeug still have to reload in development) and WebSocket
    if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        transcoder_client = TranscoderClient(current_config)
        socketio.on_namespace(PlaybackNamespace(transcoder_client=transcoder_client))

    return app
