import urllib.parse

import requests_unixsocket

from .. import director_config


SOCKET_PATH = '/var/run/docker.sock'
API_VERSION = 'v1.30'

_socket_path_quote = urllib.parse.quote(director_config.DOCKER_SOCKET_PATH, safe='')
_url_prefix = f'http+unix://{_socket_path_quote}/{API_VERSION}'
_session = requests_unixsocket.Session()


def _handle_response_errors(r):
    if r.status_code >= 400:
        raise RuntimeError(r.json()['message'])
    else:
        r.raise_for_status()


def get_server_version():
    """Returns the daemon's version string"""
    return _session.get(_url_prefix + '/info').json()['ServerVersion']


def inspect_container(container_id):
    return _session.get(_url_prefix + f'/containers/{container_id}/json').json()


def create_container(image_name, environ=None, networks=None, container_name=None, auto_remove=False, shm_size=None):
    """Creates a new container from the given image

    :param str image_name: The name of the image to start
    :param list environ: List of environment variables in form ``KEY=VALUE``
    :param list networks: List of network names to attach to this container (auto-configured)
    :param str container_name: The desired name for the new container
    :param bool auto_remove: If the container should be removed automatically when stopepd
    :param int shm_size: Size of /dev/shm in MB
    :return: The created container ID
    :rtype: str
    :raise: RuntimeError if the request is unsuccessful
    :raise: HTTPError if the request cannot be made
    """
    # https://docs.docker.com/engine/api/v1.40/#operation/ContainerCreate
    host_config = {'AutoRemove': auto_remove}
    if shm_size is not None:
        host_config['ShmSize'] = shm_size * 1024 * 1024
    request_data = {
        'Image': image_name,
        'HostConfig': host_config
    }
    if environ is not None:
        request_data['Env'] = environ
    if networks is not None:
        nets_dict = {}
        for net_name in networks:
            nets_dict[net_name] = {}
        request_data['NetworkingConfig'] = {'EndpointsConfig': nets_dict}
    url_params = '' if container_name is None else f'?name={container_name}'

    r = _session.post(_url_prefix + '/containers/create' + url_params, json=request_data)

    if r.ok:
        return r.json()['Id']
    _handle_response_errors(r)


def start_container(container_id):
    """Starts a container by ID

    :param str container_id: The ID of the container
    """
    r = _session.post(_url_prefix + f'/containers/{container_id}/start')
    _handle_response_errors(r)


def stop_container(container_id):
    """Stops a container by ID

    :param str container_id: The ID of the container
    """
    r = _session.post(_url_prefix + f'/containers/{container_id}/stop')
    _handle_response_errors(r)


def start_new_container(**kwargs):
    """Creates and starts a new container from the given image"""
    container_id = create_container(**kwargs)
    start_container(container_id)
    return container_id
