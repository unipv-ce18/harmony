from common.backend_config import BackendConfig


# TODO: Instantiate in service __init__, support different deployment configurations, separate between orch./transcoder

class Config(BackendConfig):
    """Transcoder microservice configuration"""


transcoder_config = Config()
