from ..backend_config import BackendConfig
from .storage import Storage


def connect_storage(config: BackendConfig):
    import minio
    return minio.Minio(config.STORAGE_ENDPOINT,
                       access_key=config.STORAGE_ACCESS_KEY,
                       secret_key=config.STORAGE_SECRET_KEY,
                       secure=config.STORAGE_USE_TLS)


def get_storage_interface(config: BackendConfig):
    st = Storage(connect_storage(config))

    for bucket in [config.STORAGE_BUCKET_REFERENCE, config.STORAGE_BUCKET_TRANSCODED]:
        if not st.check_bucket_exist(bucket):
            st.create_bucket(bucket)

    return st


def get_transcoded_songs_bucket_url(config: BackendConfig):
    scheme = 'https' if config.STORAGE_USE_TLS else 'http'
    return f'{scheme}://{config.STORAGE_ENDPOINT_PUBLIC}/{config.STORAGE_BUCKET_TRANSCODED}'
