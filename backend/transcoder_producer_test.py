import pymongo
from transcoder import TranscoderProducer, TranscoderWorkerNotification


def producer_work(producer, queue, id):
    td = TranscoderWorkerNotification(queue, id)
    td.start()
    producer.add_to_queue(id)


producer = TranscoderProducer()
queue = producer.get_queue()


id_list = [
    '5de5193278839c3c6c84062f',
    '5de5193278839c3c6c840634',
    '5de5193278839c3c6c840632'
]

for id in id_list:
    producer_work(producer, queue, id)

producer.close_connection()
