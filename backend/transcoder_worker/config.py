import os
import sys

from common.backend_config import BackendConfig


# TODO: Instantiate in service __init__, support different deployment configurations, separate between orch./transcoder

def _get_default_packager_path():
    binary_name = 'packager-win.exe' if sys.platform == 'win32' else 'packager-linux'
    return os.path.join(__package__, binary_name)


class Config(BackendConfig):
    """Transcoder microservice configuration"""

    PACKAGER_PATH = os.environ.get('PACKAGER_PATH') or _get_default_packager_path()
    WORK_DIR = 'tmp'


transcoder_config = Config()
