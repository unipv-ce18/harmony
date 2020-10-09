import logging
import os.path

from .worker_driver import WorkerDriver
from .. import director_config


_log = logging.getLogger(__name__)


def _detect_driver():
    if os.path.isfile('/.dockerenv') and os.path.exists(director_config.DOCKER_SOCKET_PATH):
        return 'docker'

    try:
        import worker
        return 'process'
    except ModuleNotFoundError:
        pass

    raise RuntimeError('Cannot auto-detect transcoder worker driver')


def create_driver_from_env(config) -> WorkerDriver:
    driver_name = config.WORKER_DRIVER or _detect_driver()
    _log.info('Using driver "%s"', driver_name)

    if driver_name == 'process':
        from .drv_process import ProcessWorkerDriver
        return ProcessWorkerDriver()
    if driver_name == 'docker':
        from .drv_docker import DockerWorkerDriver
        return DockerWorkerDriver()
    if driver_name == 'ecs':
        from .drv_ecs import EcsWorkerDriver
        return EcsWorkerDriver()
    else:
        raise ValueError(f'Unknown worker driver "{config.WORKER_DRIVER}"')
