import datetime
import os

from common.backend_config import BackendConfigDev, BackendConfigProd


class Config:
    """API Server (and Flask) configuration"""

    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'vivalacarbonara')

    JWT_ACCESS_TOKEN_EXPIRES = int(datetime.timedelta(minutes=15).total_seconds())
    JWT_REFRESH_TOKEN_EXPIRES = int(datetime.timedelta(days=30).total_seconds())
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'aiutoamici')
    JWT_BLACKLIST_ENABLED = True,
    JWT_BLACKLIST_TOKEN_CHECK = ['access', 'refresh']

    MINIO_WEBHOOK_SECRET = None

    TRANSCODING_ON_UPLOAD = True


class DevelopmentConfig(Config, BackendConfigDev):
    DEBUG = True
    TRANSCODING_ON_UPLOAD = False
    MINIO_WEBHOOK_SECRET = os.environ.get('MINIO_WEBHOOK_SECRET', 'ivitelloniinbouvette')


class ProductionConfig(Config, BackendConfigProd):
    # Load secrets from Docker in production
    pass


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}

# TODO: Deprecated, use instance from flask app
current_config = config[os.environ.get('FLASK_CONFIG', 'development')]
