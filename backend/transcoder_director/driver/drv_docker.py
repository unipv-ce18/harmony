import logging
import socket

from .worker_driver import WorkerDriver
from .. import director_config
from . import docker_api


DRIVER_TYPE = 'docker'


log = logging.getLogger(__name__)


def _get_my_net_name():
    """Retrieves the name of the first network attached to **this** container"""

    # Inspect the current director container: the hostname should match the first part of the ID
    # (you can use `docker inspect CONTAINER_NAME` in your terminal to see how this looks)
    about_me = docker_api.inspect_container(socket.gethostname())

    # Use list() to get keys of dict, return first network name as result
    return list(about_me['NetworkSettings']['Networks'])[0]


def _make_container_environment_base(config_keys):
    """Creates environment parameters from selected config keys"""
    return [f'{k}={getattr(director_config, k)}' for k in config_keys]


class DockerWorkerDriver(WorkerDriver):

    def __init__(self):
        super().__init__()
        self.environ_base = _make_container_environment_base(director_config.DOCKER_SHARED_CONFIG_KEYS)
        self.network_name = _get_my_net_name()

        log.info('Using Docker daemon, version %s', docker_api.get_server_version())
        log.debug('Spawned workers will be attached to the "%s" network', self.network_name)

    def start_worker(self, worker_tag):
        container_id = docker_api.start_new_container(
            image_name=director_config.DOCKER_WORKER_IMAGE,
            environ=[*self.environ_base, f'HARMONY_WORKER_ID={worker_tag}'],
            networks=[self.network_name],
            shm_size=1024,
            container_name=f'harmony_transcoder-worker_{worker_tag}',
            auto_remove=True
        )
        return {'type': DRIVER_TYPE, 'container_id': container_id}

    def stop_worker(self, driver_data):
        handle_type = driver_data['type']
        if handle_type != DRIVER_TYPE:
            raise ValueError(f'Driver handle type must be "{DRIVER_TYPE}", was "{handle_type}"')
        docker_api.stop_container(driver_data['container_id'])  # Don't need to remove since auto_remove=True
