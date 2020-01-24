import uuid

import pika

from .transcoder import Transcoder
from .config import config_rabbitmq
from common.database import Database
from storage import minio_client


class TranscoderWorker:
    def __init__(self, db_connection, consumer_tag=None):
        """Initialize Transcoder Worker.

        :param pymongo.database.Database db_connection: database connection instance
        :param str consumer_tag: the consumer tag specific of the worker
        """
        self.transcoder = Transcoder(db_connection, minio_client)
        self.db = Database(db_connection)

        self.consumer_tag = consumer_tag if consumer_tag is not None else uuid.uuid4().hex

        print('Connection to RabbitMQ...')

        self.connect()
        self.consuming_declare()
        self.notification_declare()

        print('...made')

    def connect(self):
        """Connect to RabbitMQ."""
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
        """Declare the exchange used to receive the id of the songs to transcode.
        Declare the durable queue where the messages arrive and bind it to the
        transcoder exchange.
        """
        self.channel.exchange_declare(
            exchange=config_rabbitmq['transcoder_exchange'],
            exchange_type='direct'
        )

        self.channel.queue_declare(
            queue=config_rabbitmq['transcoder_queue'],
            durable=True,
            arguments={'x-message-ttl': 60000}
        )

        self.channel.queue_bind(
            exchange=config_rabbitmq['transcoder_exchange'],
            queue=config_rabbitmq['transcoder_queue'],
            routing_key=config_rabbitmq['routing']
        )

    def notification_declare(self):
        """Declare the exchange used to notify the api server."""
        self.channel.exchange_declare(
            exchange=config_rabbitmq['notification_exchange'],
            exchange_type='direct'
        )

    def consuming(self):
        """Wait for song to transcode in transcoder queue.

        prefetch_count is set to 1 so that no more than one message can be
        unacknowledged for each worker.
        """
        self.channel.basic_qos(prefetch_count=1)

        self.channel.basic_consume(
            queue=config_rabbitmq['transcoder_queue'],
            on_message_callback=self.callback,
            consumer_tag=self.consumer_tag
        )

        try:
            self.channel.start_consuming()
        except:
            self.db.remove_consumer_tag(self.consumer_tag)
            print('\nClosing connection')
            self.connection.close()

    def callback(self, ch, method, properties, body):
        """Callback function.

        When the message arrives, perform transcoding on it, publish a notification
        to the notification exchange, and send an acknowledgment to RabbitMQ broker.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message, i.e. the id of the song to
            transcode
        """
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
