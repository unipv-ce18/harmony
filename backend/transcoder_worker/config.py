import os
import sys

from common.backend_config import BackendConfigDev, BackendConfigProd


def _get_default_packager_path():
    binary_name = 'packager-win.exe' if sys.platform == 'win32' else 'packager-linux'
    return os.path.join(__package__, binary_name)


class Config:
    """Transcoder microservice configuration"""

    # Where to find the Shaka Packager binary
    PACKAGER_PATH = os.environ.get('PACKAGER_PATH') or _get_default_packager_path()

    # Directory to store temporary job files
    WORK_DIR = os.environ.get('WORK_DIR', 'tmp')

    # Output variants bitrate in Kbps, 160kbps Vorbis is roughly equivalent to 320kbps MP3
    VARIANTS_BITRATE = [40, 96, 160]


class DevelopmentConfig(Config, BackendConfigDev):
    pass


class ProductionConfig(Config, BackendConfigProd):
    pass


config_envs = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}
