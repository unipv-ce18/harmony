import logging

import pika

from common.messaging.amq_util import amq_connect_blocking, amq_worker_declaration
from .config import transcoder_config
from .transcoder import Transcoder
from storage import minio_client


log = logging.getLogger(__name__)


class TranscoderWorker:
    def __init__(self, consumer_tag, db_interface):
        """Initialize Transcoder Worker.

        :param common.database.Database db_interface: database handling interface
        :param str consumer_tag: the consumer tag specific of the worker
        """
        if consumer_tag is None:
            raise ValueError('Consumer tag expected')
        self.consumer_tag = consumer_tag

        self.transcoder = Transcoder(db_interface, minio_client)
        self.db = db_interface

        self.connection = amq_connect_blocking(transcoder_config)
        self.channel = self.connection.channel()
        log.debug('Connected to RabbitMQ')

        # Create a jobs queue for this worker and bind it to the workers exchange
        amq_worker_declaration(self.channel, transcoder_config)

    def run(self):
        """Wait for song to transcode in transcoder queue.

        prefetch_count is set to 1 so that no more than one message can be
        unacknowledged for each worker.
        """
        self.channel.basic_qos(prefetch_count=1)

        self.channel.basic_consume(
            queue=transcoder_config.MESSAGING_QUEUE_WORKER,
            on_message_callback=self.callback,
            consumer_tag=self.consumer_tag
        )

        try:
            self.channel.start_consuming()
        except Exception as e:
            log.error('Exception in worker: %s', e)

            log.debug('Deleting consumer (%s)', self.consumer_tag)
            # TODO do we want to delete it here or in orchestrator?
            self.db.remove_worker(self.consumer_tag)

            log.debug('Closing connection')
            self.connection.close()

    def callback(self, ch, method, properties, body):
        """Callback function.

        When the message arrives, perform transcoding on it, publish a notification
        to the notification exchange, and send an acknowledgment to RabbitMQ broker.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message, i.e. the id of the song to
            transcode
        """
        song_id = body.decode('utf-8')
        log.debug('(%s) received (%s)', self.consumer_tag, song_id)

        # bind the consumer to the song to transcode
        self.db.bind_consumer_to_song(self.consumer_tag, song_id)

        self.transcoder.complete_transcode(song_id)

        ch.basic_publish(
            exchange=transcoder_config.MESSAGING_EXCHANGE_NOTIFICATION,
            routing_key=song_id,
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        # unbind the consumer from the transcoded song
        self.db.unbind_consumer_from_song(self.consumer_tag)
        ch.basic_ack(delivery_tag=method.delivery_tag)
