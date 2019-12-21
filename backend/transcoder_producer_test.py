from transcoder import TranscoderProducer, TranscoderWorkerNotification


def producer_work(producer, queue, id):
    td = TranscoderWorkerNotification(queue, id)
    td.start()
    producer.add_to_queue(id)


producer = TranscoderProducer()
queue = producer.get_queue()


id_list = [
    '5dfd65de57475213eea24160',
    '5dfd65de57475213eea24164',
    '5dfd65de57475213eea24174'
]

for id in id_list:
    producer_work(producer, queue, id)

producer.close_connection()
