import pika

from .transcoder import Transcoder
from .config import config_rabbitmq
from storage import minio_client


class TranscoderWorker:
    def __init__(self, db_connection):
        self.transcoder = Transcoder(db_connection, minio_client)

        print('Connection to RabbitMQ...')

        params = pika.ConnectionParameters(host=config_rabbitmq['host'])
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

        self.channel.exchange_declare(
            exchange=config_rabbitmq['exchange'],
            exchange_type='direct'
        )

        self.channel.queue_declare(
            queue=config_rabbitmq['queue'],
            durable=True,
            arguments={'x-message-ttl': 60000}
        )

        self.channel.queue_bind(
            exchange=config_rabbitmq['exchange'],
            queue=config_rabbitmq['queue'],
            routing_key=config_rabbitmq['routing']
        )

        print('...made')

    def consuming(self):
        def callback(ch, method, properties, body):
            print(f'received {body}')
            self.transcoder.complete_transcode(body.decode('utf-8'))
            ch.basic_ack(delivery_tag=method.delivery_tag)

        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=config_rabbitmq['queue'],
            on_message_callback=callback
        )

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print('\nClosing connection')
            self.connection.close()
