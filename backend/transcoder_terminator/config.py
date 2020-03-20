from common.backend_config import BackendConfig


class Config(BackendConfig):
    """Terminator microservice configuration"""

    WORKER_DRIVER = None    # Auto-detect, can be 'process' or 'docker'
    POLLING_CYCLE = 300     # expressed in seconds


terminator_config = Config()
