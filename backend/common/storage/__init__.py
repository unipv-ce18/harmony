from ..backend_config import BackendConfig
from .storage import Storage


def connect_storage(config: BackendConfig):
    import minio
    return minio.Minio(config.STORAGE_ENDPOINT,
                       access_key=config.STORAGE_ACCESS_KEY,
                       secret_key=config.STORAGE_SECRET_KEY,
                       secure=config.STORAGE_USE_TLS)

def create_missing_buckets(config: BackendConfig, st: Storage):
    for bucket in [config.STORAGE_BUCKET_REFERENCE, config.STORAGE_BUCKET_TRANSCODED]:
        if not st.check_bucket_exist(bucket):
            st.create_bucket(bucket)
