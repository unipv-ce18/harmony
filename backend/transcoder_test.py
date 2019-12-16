import pymongo
from transcoder import TranscoderProducer, TranscoderWorker
from apiserver.config import current_config


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                                username=current_config.MONGO_USERNAME,
                                password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()


producer = TranscoderProducer()
worker = TranscoderWorker(harmony)

producer.add_to_queue('5de5193278839c3c6c84062f')
worker.consuming()
