from common.backend_config import BackendConfig


class Config(BackendConfig):
    """Transcoder microservice configuration"""

    WORKER_DRIVER = None                # Auto-detect, can be 'process' or 'docker'

    TERMINATOR_IDLE_REMOVAL = 60       # On each run, remove workers that stayed idle for more than this (in seconds)
    TERMINATOR_POLLING_CYCLE = 60      # Amount of time between idle worker termination runs (in seconds)


director_config = Config()
