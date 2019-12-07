from minio import Minio

from .storage import Storage
from .config import config_storage


minio_client = Minio(config_storage['Endpoint'],
                     access_key=config_storage['AccessKey'],
                     secret_key=config_storage['SecretKey'],
                     secure=config_storage['TLS'])
