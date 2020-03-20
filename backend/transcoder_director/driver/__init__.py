import logging
import os.path

from .worker_driver import WorkerDriver
from .drv_process import ProcessWorkerDriver
from .drv_docker import DockerWorkerDriver
from .. import director_config

_log = logging.getLogger(__name__)


def _detect_driver():
    if os.path.isfile('/.dockerenv') and os.path.exists(director_config.DOCKER_SOCKET_PATH):
        return 'docker'

    try:
        import transcoder_worker
        return 'process'
    except ModuleNotFoundError:
        pass

    raise RuntimeError('Cannot auto-detect transcoder worker driver')


def create_driver_from_env(config) -> WorkerDriver:
    driver_name = config.WORKER_DRIVER or _detect_driver()
    _log.info('Using driver "%s"', driver_name)

    if driver_name == 'docker':
        return DockerWorkerDriver()
    if driver_name == 'process':
        return ProcessWorkerDriver()
    else:
        raise ValueError(f'Unknown worker driver "{config.WORKER_DRIVER}"')
