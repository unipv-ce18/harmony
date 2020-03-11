import os

from common.backend_config import BackendConfigDev, BackendConfigProd


class Config:
    """API Server (and Flask) configuration"""

    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'vivalacarbonara')

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'aiutoamici')
    JWT_BLACKLIST_ENABLED = True,
    JWT_BLACKLIST_TOKEN_CHECK = ['access', 'refresh']

    QUEUE_EXCHANGE_APISERVER = 'api_exchange'               # Where transcoding jobs are published
    QUEUE_EXCHANGE_NOTIFICATION = 'notification_exchange'   # Where completion notifications are fetched


class DevelopmentConfig(Config, BackendConfigDev):
    DEBUG = True


class ProductionConfig(Config, BackendConfigProd):
    # Load secrets from Docker in production
    pass


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,

    'default': DevelopmentConfig
}

# TODO: Deprecated, use instance from flask app
current_config = config[os.getenv('FLASK_CONFIG') or 'default']
