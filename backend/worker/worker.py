import logging
import json

import pika

from common.messaging.amq_util import amq_connect_blocking, amq_worker_declaration
import common.messaging.jobs as jobs
from . import worker_config
from .transcoder import Transcoder
from .change_pitch import ChangePitch


log = logging.getLogger(__name__)


class Worker:
    def __init__(self, consumer_tag, db_interface, storage_interface):
        """Initialize Transcoder Worker.

        :param str consumer_tag: the consumer tag specific of the worker
        :param common.database.Database db_interface: database handling interface
        :param common.storage.Storage storage_interface: storage interface
        """
        if consumer_tag is None:
            raise ValueError('Consumer tag expected')
        self.consumer_tag = consumer_tag

        self.transcoder = Transcoder(db_interface, storage_interface)
        self.change_pitch = ChangePitch(db_interface, storage_interface)

        self.db = db_interface

        self.connection = amq_connect_blocking(worker_config)
        self.channel = self.connection.channel()
        log.debug('Connected to RabbitMQ')

        # Create a jobs queue for this worker and bind it to the workers exchange
        amq_worker_declaration(self.channel, worker_config)

    def run(self):
        """Wait for song to transcode in transcoder queue.

        prefetch_count is set to 1 so that no more than one message can be
        unacknowledged for each worker.
        """
        self.channel.basic_qos(prefetch_count=1)

        self.channel.basic_consume(
            queue=worker_config.MESSAGING_QUEUE_WORKER,
            on_message_callback=self.callback,
            consumer_tag=self.consumer_tag
        )

        try:
            self.channel.start_consuming()

            # No exceptions, assume exited gracefully, break loop
            log.info('Shutting down')

        except Exception as e:
            log.exception('Exception in worker: %s(%s)', type(e).__name__, e)

        finally:
            log.debug('Deleting consumer (%s)', self.consumer_tag)
            # TODO do we want to delete it here or in orchestrator?
            self.db.remove_worker(self.consumer_tag)

            if self.connection is not None:
                self.connection.close()

    def shutdown(self):
        self.channel.close()

    def transcode_callback(self, ch, method, properties, message):
        song_id = message['song_id']
        log.debug('(%s) received (%s) for %s job', self.consumer_tag, song_id, jobs.TRANSCODE)

        # bind the consumer to the song to transcode
        self.db.bind_consumer_to_song(self.consumer_tag, song_id)
        self.transcoder.complete_transcode(song_id)
        return song_id

    def change_pitch_callback(self, ch, method, properties, message):
        song_id = message['song_id']
        semitones = message['semitones']
        output_format = message['output_format']
        log.debug('(%s) received (%s) for %s job', self.consumer_tag, song_id, jobs.CHANGE_PITCH)

        self.db.bind_consumer_to_song(self.consumer_tag, song_id)
        self.change_pitch.complete_change_pitch(song_id, semitones, output_format)
        return song_id

    def callback(self, ch, method, properties, body):
        """Callback function.

        When the message arrives, perform transcoding on it, publish a notification
        to the notification exchange, and send an acknowledgment to RabbitMQ broker.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message
        """
        message = json.loads(body.decode('utf-8'))

        if message['type'] == jobs.TRANSCODE:
            song_id = self.transcode_callback(ch, method, properties, message)

        if message['type'] == jobs.CHANGE_PITCH:
            song_id = self.change_pitch_callback(ch, method, properties, message)

        ch.basic_publish(
            exchange=worker_config.MESSAGING_EXCHANGE_NOTIFICATION,
            routing_key=song_id,
            body=song_id,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        # unbind the consumer from the transcoded song
        self.db.unbind_consumer_from_song(self.consumer_tag)

        ch.basic_ack(delivery_tag=method.delivery_tag)
