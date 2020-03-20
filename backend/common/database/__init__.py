from ..backend_config import BackendConfig
from .database import Database


def connect_db(config: BackendConfig):
    import pymongo
    return pymongo.MongoClient(config.MONGO_URI,
                               username=config.MONGO_USERNAME,
                               password=config.MONGO_PASSWORD)
