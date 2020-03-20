from common.backend_config import BackendConfig


class Config(BackendConfig):
    """Storage microservice configuration"""

    BUCKETS = ['lossless-songs', 'compressed-songs']


storage_config = Config()
