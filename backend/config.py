import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vivalacarbonara'
    JWT_SECRET_KEY = os.environ.get('SECRET_KEY') or 'aiutoamici'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/harmony?authSource=harmony'
    MONGO_USERNAME = os.environ.get('MONGO_USERNAME') or 'harmony'
    MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD') or 'pastina'
    MONGO_DBNAME = os.environ.get('MONGO_DBNAME') or 'harmony'


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
