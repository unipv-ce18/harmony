import os

from common.backend_config import BackendConfigDev, BackendConfigProd


class Config:
    """Transcoder microservice configuration"""

    WORKER_DRIVER = os.environ.get('WORKER_DRIVER', None)                # Auto-detect, can be 'process' or 'docker'

    TERMINATOR_IDLE_REMOVAL_CONSUMERS = 300       # On each run, remove workers that stayed idle for more than this (in seconds)
    TERMINATOR_IDLE_REMOVAL_UPLOADS = 1800       # On each run, remove uploads that stayed pending for more than this (in seconds)
    TERMINATOR_IDLE_REMOVAL_CONTENTS = 1       # On each run, remove contents that have to be eliminated for more than this (in seconds)
    TERMINATOR_POLLING_CYCLE = 300      # Amount of time between idle worker termination runs (in seconds)

    UPDATE_COUNTER = 1000     # update the database after this value of new listening

    PREFETCH_COUNT = 100    # number of unacknowledged messages on channel (or connection) when consuming

    # --- Parameters for the 'process' worker driver ---

    # The python commandline to start the new process
    PROCESS_COMMANDLINE = ['python3', '-m', 'worker']

    # --- Parameters for the 'docker' worker driver ---

    # Location of the controlling docker socket
    DOCKER_SOCKET_PATH = os.environ.get('DOCKER_SOCKET_PATH', '/var/run/docker.sock')

    # The image used to create worker instances
    DOCKER_WORKER_IMAGE = os.environ.get('DOCKER_WORKER_IMAGE', 'harmony/worker:dev')

    # Config settings to pass to the created container
    DOCKER_SHARED_CONFIG_KEYS = ['MONGO_URI', 'MESSAGING_HOST', 'STORAGE_ENDPOINT']

    # Whether spawned containers have the auto-remove flag set
    DOCKER_AUTO_REMOVE = True

    # --- Parameters for the 'ecs' worker driver ---

    # Credentials used for AWS login
    ECS_ACCESS_KEY = os.environ.get('ECS_ACCESS_KEY')
    ECS_SECRET_KEY = os.environ.get('ECS_SECRET_KEY')

    # (optional) role to assume before operating
    ECS_ROLE = os.environ.get('ECS_ROLE')

    # Cluster ARN on which new tasks will be spawned
    ECS_CLUSTER_ARN = os.environ.get('ECS_CLUSTER_ARN')

    # Comma separated list of subnet IDs for spawned tasks to be in
    ECS_SUBNETS = os.environ.get('ECS_SUBNETS')

    # Task definition used as a template for tasks
    ECS_TASK_DEFINITION = os.environ.get('ECS_TASK_DEFINITION')

    # Container name in the task definition used when overriding environment
    ECS_TASK_CONTAINER_NAME = os.environ.get('ECS_TASK_CONTAINER_NAME')


class DevelopmentConfig(Config, BackendConfigDev):

    UPDATE_COUNTER = 2
    PREFETCH_COUNT = 25
    DOCKER_AUTO_REMOVE = False


class ProductionConfig(Config, BackendConfigProd):
    pass


config_envs = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}
