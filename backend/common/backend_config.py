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
    MESSAGING_PORT = int(os.environ.get('MESSAGING_PORT', '5672'))
    MESSAGING_USERNAME = os.environ.get('MESSAGING_USERNAME', 'guest')
    MESSAGING_PASSWORD = os.environ.get('MESSAGING_PASSWORD', 'guest')
    MESSAGING_EXCHANGE_JOBS = 'harmony.transcode.jobs'                  # Where API server pushes new transcoding jobs
    MESSAGING_EXCHANGE_NOTIFICATION = 'harmony.transcode.notification'  # Where completion notifications are to be sent
    MESSAGING_EXCHANGE_WORKER = 'harmony.transcode.worker'              # Where orchestrator sends jobs to workers
    MESSAGING_QUEUE_JOBS = 'harmony.queue.jobs'                         # Where orchestator gets messages
    MESSAGING_QUEUE_WORKER = 'harmony.queue.worker'                     # Where worker gets message


class BackendConfigDev(BackendConfig):
    pass


class BackendConfigProd(BackendConfig):
    pass
