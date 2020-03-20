from minio import Minio

from .storage import Storage
from .config import storage_config


minio_client = Minio(storage_config.ENDPOINT,
                     access_key=storage_config.ACCESS_KEY,
                     secret_key=storage_config.SECRET_KEY,
                     secure=storage_config.TLS)
