import pymongo
from transcoder import TranscoderWorker
from apiserver.config import current_config


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                                username=current_config.MONGO_USERNAME,
                                password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()


def consumer_work(db_connection):
    worker = TranscoderWorker(harmony)
    worker.consuming()


if __name__ == '__main__':
    consumer_work(harmony)
