import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vivalacarbonara'

    # Note: ?authSource  is not required if same db
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/harmony'
    MONGO_USERNAME = os.environ.get('MONGO_USERNAME') or 'harmony'
    MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD') or 'pastina'

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'aiutoamici'
    JWT_BLACKLIST_ENABLED = True,
    JWT_BLACKLIST_TOKEN_CHECK = ['access', 'refresh']


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    # Load secrets from Docker in production
    pass


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,

    'default': DevelopmentConfig
}

current_config = config[os.getenv('FLASK_CONFIG') or 'default']
