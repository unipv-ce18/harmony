import logging
import uuid

import pika

from common.messaging.amq_util import machine_id, amq_connect_blocking
from .config import transcoder_config
from .transcoder import Transcoder
from common.database import Database
from storage import minio_client


log = logging.getLogger(__name__)


class TranscoderWorker:
    def __init__(self, db_connection, consumer_tag=None):
        """Initialize Transcoder Worker.

        :param pymongo.database.Database db_connection: database connection instance
        :param str consumer_tag: the consumer tag specific of the worker
        """
        self.transcoder = Transcoder(db_connection, minio_client)
        self.db = Database(db_connection)

        self.queue_name = f'worker-{machine_id}'
        self.consumer_tag = consumer_tag if consumer_tag is not None else uuid.uuid4().hex

        self.connection = amq_connect_blocking(transcoder_config)
        self.channel = self.connection.channel()
        log.debug('Connected to RabbitMQ')

        # Create a jobs queue for this worker and bind it to the workers exchange
        self.channel.queue_declare(self.queue_name, durable=True, arguments={'x-message-ttl': 60000})
        self.channel.queue_bind(exchange=transcoder_config.MESSAGING_EXCHANGE_WORKER,
                                queue=self.queue_name,
                                routing_key='id')

    def notification_declare(self):
        """Declare the exchange used to notify the api server."""
        self.channel.exchange_declare(transcoder_config.MESSAGING_EXCHANGE_NOTIFICATION, exchange_type='direct')

    def consuming(self):
        """Wait for song to transcode in transcoder queue.

        prefetch_count is set to 1 so that no more than one message can be
        unacknowledged for each worker.
        """
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(self.queue_name, self.callback, consumer_tag=self.consumer_tag)

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
            exchange=transcoder_config.MESSAGING_EXCHANGE_NOTIFICATION,
            routing_key=body.decode('utf-8'),
            body=body,
            properties=pika.BasicProperties(delivery_mode=2))
        ch.basic_ack(delivery_tag=method.delivery_tag)
