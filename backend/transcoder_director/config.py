from common.backend_config import BackendConfig


class Config(BackendConfig):
    """Transcoder microservice configuration"""

    WORKER_DRIVER = None    # Auto-detect, can be 'process' or 'docker'


director_config = Config()
