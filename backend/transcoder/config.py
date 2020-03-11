from common.backend_config import BackendConfig


# TODO: Instantiate in service __init__, support different deployment configurations, separate between orch./transcoder

class Config(BackendConfig):
    """Transcoder microservice configuration"""

    # TODO: Find a better name for these
    QUEUE_EXCHANGE_APISERVER = 'api_exchange'               # Where transcoding jobs are obtained from frontend
    QUEUE_EXCHANGE_TRANSCODER = 'transcoder_exchange'       # Where orchestrator sends transcode jobs
    QUEUE_EXCHANGE_NOTIFICATION = 'notification_exchange'   # Where completion notifications are to be sent
    QUEUE_APISERVER = 'api_queue'
    QUEUE_TRANSCODER = 'transcoder_queue'


transcoder_config = Config()
