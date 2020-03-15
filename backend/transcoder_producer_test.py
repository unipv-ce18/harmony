from transcoder import TranscoderProducer, NotificationWorker


def producer_work(producer, queue, id):
    td = NotificationWorker(queue, id)
    td.start()
    producer.add_to_queue(id)


producer = TranscoderProducer()
queue = producer.get_queue()


id_list = [
    '5dfd65de57475213eea24168',
    '5dfd65de57475213eea24174',
    '5dfd65de57475213eea24178'
]

for id in id_list:
    producer_work(producer, queue, id)

producer.close_connection()