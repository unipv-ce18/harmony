import uuid

import pika

from .config import transcoder_config
from .transcoder import Transcoder
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
        # TODO: Put a function in common to create these params once and for all
        params = pika.ConnectionParameters(
            host=transcoder_config.QUEUE_HOST,
            port=transcoder_config.QUEUE_PORT,
            credentials=pika.PlainCredentials(transcoder_config.QUEUE_USERNAME, transcoder_config.QUEUE_PASSWORD)
        )
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

    def consuming_declare(self):
        """Declare the exchange used to receive the id of the songs to transcode.
        Declare the durable queue where the messages arrive and bind it to the
        transcoder exchange.
        """
        self.channel.exchange_declare(
            exchange=transcoder_config.QUEUE_EXCHANGE_TRANSCODER,
            exchange_type='direct'
        )

        self.channel.queue_declare(
            queue=transcoder_config.QUEUE_TRANSCODER,
            durable=True,
            arguments={'x-message-ttl': 60000}
        )

        self.channel.queue_bind(
            exchange=transcoder_config.QUEUE_EXCHANGE_TRANSCODER,
            queue=transcoder_config.QUEUE_TRANSCODER,
            routing_key='id'
        )

    def notification_declare(self):
        """Declare the exchange used to notify the api server."""
        self.channel.exchange_declare(
            exchange=transcoder_config.QUEUE_EXCHANGE_NOTIFICATION,
            exchange_type='direct'
        )

    def consuming(self):
        """Wait for song to transcode in transcoder queue.

        prefetch_count is set to 1 so that no more than one message can be
        unacknowledged for each worker.
        """
        self.channel.basic_qos(prefetch_count=1)

        self.channel.basic_consume(
            queue=transcoder_config.QUEUE_TRANSCODER,
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
            exchange=transcoder_config.QUEUE_EXCHANGE_NOTIFICATION,
            routing_key=body.decode('utf-8'),
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
