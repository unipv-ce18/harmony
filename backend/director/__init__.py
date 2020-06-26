import os

from .config import config_envs


director_config = config_envs[os.environ.get('HARMONY_CONFIG', 'development')]
