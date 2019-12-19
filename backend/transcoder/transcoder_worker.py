import pika

from .transcoder import Transcoder
from .config import config_rabbitmq
from storage import minio_client


class TranscoderWorker:
    def __init__(self, db_connection):
        self.transcoder = Transcoder(db_connection, minio_client)

        print('Connection to RabbitMQ...')

        self.connect()
        self.consuming_declare()
        self.notification_declare()

        print('...made')

    def connect(self):
        params = pika.ConnectionParameters(
            host=config_rabbitmq['host'],
            port=config_rabbitmq['port'],
            credentials=pika.PlainCredentials(
                config_rabbitmq['username'],
                config_rabbitmq['password']
            )
        )
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

    def consuming_declare(self):
        self.channel.exchange_declare(
            exchange=config_rabbitmq['exchange'],
            exchange_type='direct'
        )

        self.queue = self.channel.queue_declare(
                         queue=config_rabbitmq['queue'],
                         durable=True,
                         arguments={'x-message-ttl': 60000}
                     )

        self.channel.queue_bind(
            exchange=config_rabbitmq['exchange'],
            queue=config_rabbitmq['queue'],
            routing_key=config_rabbitmq['routing']
        )

    def notification_declare(self):
        self.channel.exchange_declare(
            exchange=config_rabbitmq['notification_exchange'],
            exchange_type='direct'
        )

    def consuming(self):
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=config_rabbitmq['queue'],
            on_message_callback=self.callback
        )

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print('\nClosing connection')
            self.connection.close()

    def callback(self, ch, method, properties, body):
        print(f'received {body}')
        self.transcoder.complete_transcode(body.decode('utf-8'))

        ch.basic_publish(
            exchange=config_rabbitmq['notification_exchange'],
            routing_key=body.decode('utf-8'),
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
