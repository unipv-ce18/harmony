from common.backend_config import BackendConfig
from .storage import Storage


def connect_storage(config: BackendConfig):
    import minio
    return minio.Minio(config.STORAGE_ENDPOINT,
                       access_key=config.STORAGE_ACCESS_KEY,
                       secret_key=config.STORAGE_SECRET_KEY,
                       secure=config.STORAGE_USE_TLS)
