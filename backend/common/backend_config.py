import os


class BackendConfig:
    """Common infrastructure configuration"""

    # MongoDB connection
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://alpine:27017/harmony')  # "?authSource" not required if same db
    MONGO_USERNAME = os.environ.get('MONGO_USERNAME', 'admin')  # TODO: Rename to harmony to match Docker config
    MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD', 'pastina')

    # RabbitMQ connection
    QUEUE_HOST = os.environ.get('QUEUE_HOST', 'alpine')
    QUEUE_PORT = int(os.environ.get('QUEUE_PORT', '5672'))
    QUEUE_USERNAME = os.environ.get('QUEUE_USERNAME', 'guest')
    QUEUE_PASSWORD = os.environ.get('QUEUE_PASSWORD', 'guest')


class BackendConfigDev(BackendConfig):
    pass


class BackendConfigProd(BackendConfig):
    pass
