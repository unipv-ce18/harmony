import os

from dotenv import load_dotenv


# Load local environment from .env file
load_dotenv()


class BackendConfig:
    """Common infrastructure configuration"""

    # MongoDB connection
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/harmony')  # ?authSource not required if same db
    MONGO_USERNAME = os.environ.get('MONGO_USERNAME', 'harmony')
    MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD', 'pastina')

    # RabbitMQ connection
    MESSAGING_HOST = os.environ.get('MESSAGING_HOST', 'localhost')
    MESSAGING_USE_TLS = bool(os.environ.get('MESSAGING_USE_TLS'))
    MESSAGING_PORT = int(os.environ.get('MESSAGING_PORT', '5671' if MESSAGING_USE_TLS else '5672'))
    MESSAGING_VIRTUAL_HOST = os.environ.get('MESSAGING_VIRTUAL_HOST', None)
    MESSAGING_USERNAME = os.environ.get('MESSAGING_USERNAME', 'guest')
    MESSAGING_PASSWORD = os.environ.get('MESSAGING_PASSWORD', 'guest')
    MESSAGING_EXCHANGE_JOBS = 'harmony.exchange.jobs'                  # Where API server pushes new jobs
    MESSAGING_EXCHANGE_NOTIFICATION = 'harmony.exchange.notification'  # Where completion notifications are to be sent
    MESSAGING_EXCHANGE_WORKER = 'harmony.exchange.worker'              # Where orchestrator sends jobs to workers
    MESSAGING_QUEUE_JOBS = 'harmony.queue.jobs'                         # Where orchestator gets messages
    MESSAGING_QUEUE_WORKER = 'harmony.queue.worker'                     # Where worker gets message

    # Minio connection
    STORAGE_ENDPOINT = os.environ.get('STORAGE_ENDPOINT', '127.0.0.1:9000')
    STORAGE_ENDPOINT_PUBLIC = os.environ.get('STORAGE_ENDPOINT_PUBLIC', 'localhost:9000')  # as seen by clients
    STORAGE_ACCESS_KEY = os.environ.get('STORAGE_ACCESS_KEY', 'HVTH67YJMJ3BVSHPWJOM')
    STORAGE_SECRET_KEY = os.environ.get('STORAGE_SECRET_KEY', 'kAeWXU3qV5vyofP3kTnyEmtp1BarIvE4CrQIF6wU')
    STORAGE_REGION = os.environ.get('STORAGE_REGION', None)
    STORAGE_BUCKET_REFERENCE = 'lossless-songs'
    STORAGE_BUCKET_TRANSCODED = 'compressed-songs'
    STORAGE_BUCKET_MODIFIED = 'modified-songs'
    STORAGE_BUCKET_IMAGES = 'images'

    STORAGE_AUTO_CONFIGURE = False
    STORAGE_USE_TLS = True
    STORAGE_NOTIFICATION_ARN = 'arn:minio:sqs::_:webhook'  # Minio with webhooks enabled gives us this ARN


class BackendConfigDev(BackendConfig):

    STORAGE_AUTO_CONFIGURE = True
    STORAGE_USE_TLS = False


class BackendConfigProd(BackendConfig):

    STORAGE_BUCKET_REFERENCE = 'hy-lossless-songs'
    STORAGE_BUCKET_TRANSCODED = 'hy-compressed-songs'
    STORAGE_BUCKET_MODIFIED = 'hy-modified-songs'
    STORAGE_BUCKET_IMAGES = 'hy-images'
