import os

from common.backend_config import BackendConfigDev, BackendConfigProd


class Config:
    """Transcoder microservice configuration"""

    WORKER_DRIVER = os.environ.get('WORKER_DRIVER', None)                # Auto-detect, can be 'process' or 'docker'

    DOCKER_SOCKET_PATH = os.environ.get('DOCKER_SOCKET_PATH', '/var/run/docker.sock')  # For 'docker' worker driver

    TERMINATOR_IDLE_REMOVAL = 300       # On each run, remove workers that stayed idle for more than this (in seconds)
    TERMINATOR_POLLING_CYCLE = 300      # Amount of time between idle worker termination runs (in seconds)


class DevelopmentConfig(Config, BackendConfigDev):
    pass


class ProductionConfig(Config, BackendConfigProd):
    pass


config_envs = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}
