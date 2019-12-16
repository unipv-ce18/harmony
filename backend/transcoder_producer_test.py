import pymongo
from transcoder import TranscoderProducer
from transcoder import TranscoderWorkerNotification
from database import Database
from config import current_config


db_client = pymongo.MongoClient(current_config.MONGO_URI,
                                username=current_config.MONGO_USERNAME,
                                password=current_config.MONGO_PASSWORD)
harmony = db_client.get_database()
db = Database(harmony)

producer = TranscoderProducer()
queue = producer.get_queue()


def producer_work(producer, queue, id):
    td = TranscoderWorkerNotification(queue, id)
    td.start()
    if not db.song_in_transcoding(id):
        producer.add_to_queue(id)
        db.store_song_id(id)


id_list = [
    '5de5193278839c3c6c84062f',
    '5de5193278839c3c6c840634',
    '5de5193278839c3c6c840632'
]

for id in id_list:
    producer_work(producer, queue, id)

producer.close_connection()
