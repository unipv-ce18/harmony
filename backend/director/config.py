import os

from common.backend_config import BackendConfigDev, BackendConfigProd


class Config:
    """Transcoder microservice configuration"""

    WORKER_DRIVER = os.environ.get('WORKER_DRIVER', None)                # Auto-detect, can be 'process' or 'docker'

    TERMINATOR_IDLE_REMOVAL_CONSUMERS = 300       # On each run, remove workers that stayed idle for more than this (in seconds)
    TERMINATOR_IDLE_REMOVAL_CONTENTS = 1800       # On each run, remove uploads that stayed penidng for more than this (in seconds)
    TERMINATOR_POLLING_CYCLE = 300      # Amount of time between idle worker termination runs (in seconds)

    UPDATE_COUNTER = 1000     # update the database after this value of new listening

    # --- Parameters for the 'docker' worker driver ---

    # Location of the controlling docker socket
    DOCKER_SOCKET_PATH = os.environ.get('DOCKER_SOCKET_PATH', '/var/run/docker.sock')

    # The image used to create worker instances
    DOCKER_WORKER_IMAGE = os.environ.get('DOCKER_WORKER_IMAGE', 'harmony/worker:dev')

    # Config settings to pass to the created container
    DOCKER_SHARED_CONFIG_KEYS = ['MONGO_URI', 'MESSAGING_HOST', 'STORAGE_ENDPOINT']

    # Whether spawned containers have the auto-remove flag set
    DOCKER_AUTO_REMOVE = True

    # --- Parameters for the 'process' worker driver ---

    # The python commandline to start the new process
    PROCESS_COMMANDLINE = ['python3', '-m', 'worker']


class DevelopmentConfig(Config, BackendConfigDev):

    UPDATE_COUNTER = 2
    DOCKER_AUTO_REMOVE = False


class ProductionConfig(Config, BackendConfigProd):
    pass


config_envs = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}
