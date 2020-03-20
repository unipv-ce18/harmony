import os

from .config import config_envs


transcoder_config = config_envs[os.environ.get('HARMONY_CONFIG', 'development')]
