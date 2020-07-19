import os
import sys

from common.backend_config import BackendConfigDev, BackendConfigProd


def _get_default_packager_path():
    binary_name = 'packager-win.exe' if sys.platform == 'win32' else 'packager-linux'
    return os.path.join(__package__, binary_name)


def _get_default_audiowaveform_path():
    binary_name = 'audiowaveform' + ('.exe' if sys.platform == 'win32' else '')
    path = os.path.join(__package__, binary_name)
    return path if os.path.isfile(path) else binary_name  # Default to PATH


class Config:
    """Transcoder microservice configuration"""

    # Where to find the Shaka Packager binary
    PACKAGER_PATH = os.environ.get('PACKAGER_PATH') or _get_default_packager_path()

    # Where to find BBC's audiowaveform binary
    AUDIOWAVEFORM_PATH = os.environ.get('AUDIOWAVEFORM_PATH') or _get_default_audiowaveform_path()

    # Directory to store temporary job files
    WORK_DIR = os.environ.get('WORK_DIR', 'tmp')

    # Output variants bitrate in Kbps, 160kbps Vorbis is roughly equivalent to 320kbps MP3
    VARIANTS_BITRATE = [96, 120, 160]

    # Output bitrate in Kbps for different output format
    BITRATE_WEBM = 160
    BITRATE_MP3 = 320

    # Sample decimation factor for generated waveforms (e.g. 4 mins audio * 44100 Hz / 512 zoom = ~20700 points)
    WAVEFORM_ZOOM = 16768  # 4 minutes: ~650 samples for 1.3 KB dat file


class DevelopmentConfig(Config, BackendConfigDev):
    pass


class ProductionConfig(Config, BackendConfigProd):
    pass


config_envs = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}
