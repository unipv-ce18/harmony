import logging
import uuid
import json

import pika
from pika.exceptions import ChannelClosedByBroker

from common.messaging.amq_util import amq_connect_blocking, amq_orchestrator_declaration
from . import director_config


log = logging.getLogger(__name__)


class Orchestrator:
    def __init__(self, db_interface, worker_driver):
        """Initialize Orchestrator.

        :param common.database.Database db_interface: database handling interface
        :param director.worker.WorkerDriver worker_driver: driver used to manage workers
        """
        self.db = db_interface
        self.worker_driver = worker_driver
        worker_driver.set_db(self.db)
        self.counter = {}

        self.connection = None
        self.channel = None

    def consume(self):
        """Wait for messages from api servers and publish them filtered to transcoding exchange."""
        self.channel.basic_qos(prefetch_count=25)

        self.channel.basic_consume(
            queue=director_config.MESSAGING_QUEUE_JOBS,
            on_message_callback=self.callback
        )
        log.info('Listening for messages on queue "%s"', director_config.MESSAGING_QUEUE_JOBS)
        self.channel.start_consuming()

    def run(self):
        """Making the Orchestrator run."""

        while True:
            try:
                self.connection = amq_connect_blocking(director_config)
                self.channel = self.connection.channel()
                log.debug('Connected to RabbitMQ')

                # Create the incoming jobs queue and bind it to the global jobs exchange (where API servers publish)
                amq_orchestrator_declaration(self.channel, director_config)

                self.consume()

                # No exceptions, assume exited gracefully, break loop
                log.info('Shutting down')
                break

            except ChannelClosedByBroker:
                log.info('Channel closed by broker, terminating')
                break
            except Exception as e:
                log.exception('Closing connection due to error %s(%s)', type(e).__name__, e)
                continue
            finally:
                if self.connection is not None:
                    self.connection.close()

    def shutdown(self):
        self.channel.close()

    def callback(self, ch, method, properties, body):
        """Callback function.

        When the message arrives, check if the song is already in transcoding;
        if yes, just send an ack to api server, otherwise publish the song id
        to the transcoder exchange, store the id of the song inside database,
        check if the consumers are less than the messages inside the queue and if
        so create a new transcoder worker.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message
        """
        message = json.loads(body.decode('utf-8'))

        if message['type'] == 'transcode':
            song_id = message['song_id']
            log.info('%s: Received transcode request', song_id)

            if not self.song_is_already_transcoded(song_id):
                if not self.song_is_transcoding(song_id):
                    self.push_song_in_queue(song_id)
                    self.store_pending_song(song_id)
                    if self.consumers_less_than_pending_song():
                        self.create_worker()
                else:
                    log.debug('%s: Duplicate request, ignoring', song_id)
            else:
                self.notify_api_server(song_id)
                log.debug('%s: Already converted, notification sent', song_id)

        if message['type'] == 'counter':
            song_id = list(message.keys())[0]
            song_update = {song_id: message[song_id]}

            log.info('%s: Received update request', song_id)

            if song_id in self.counter:
                self.counter[song_id] += song_update[song_id]
            else:
                self.counter = {**self.counter, **song_update}

            if len(self.counter) == director_config.UPDATE_COUNTER:
                self.update_counters()
                self.counter = {}
                log.info('Updated counters inside database')

            self.notify_api_server(song_id)
            log.debug('%s: Notify update', song_id)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def push_song_in_queue(self, id):
        """Publish song id to transcoder exchange.

        :param str id: id of the song
        """
        self.channel.basic_publish(
            exchange=director_config.MESSAGING_EXCHANGE_WORKER,
            routing_key='id',
            body=id,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )

    def notify_api_server(self, id):
        """Publish a notification to the notification exchange.

        :param str id: id of the song
        """
        log.debug('(%s) already transcoded', id)
        self.channel.basic_publish(
            exchange=director_config.MESSAGING_EXCHANGE_NOTIFICATION,
            routing_key=id,
            body=id,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )

    def store_pending_song(self, id):
        """Store id of a song in transcoding in database.

        :param str id: id of the song
        """
        self.db.put_transcoder_pending_song(id)

    def get_number_of_pending_song(self):
        """Get the number of songs in transcoder queue.

        :return: number of pending songs
        :rtype: int
        """
        return self.db.get_count_transcoder_collection()

    def song_is_transcoding(self, id):
        """Check if a song is already transcoding.

        :param str id: id of the song
        :return: True if a song is already transcoding, False otherwise
        :rtype: bool
        """
        return self.db.song_is_transcoding(id)

    def create_worker(self):
        """Create a new worker for transcoding."""
        consumer_tag = uuid.uuid4().hex
        log.info('Spinning up new worker (tag: %s)', consumer_tag)
        driver_handle = self.worker_driver.start_worker(consumer_tag)
        self.db.put_worker(consumer_tag, driver_handle)

    def get_number_of_consumers(self):
        """Get the number of alive consumers.

        :return: number of consumers
        :rtype: int
        """
        return self.db.get_count_consumers_collection()

    def consumers_less_than_pending_song(self):
        """Check if the consumers are less than the number of messages in queue.

        :return: True if consumers are less than messages, False otherwise
        :rtype: bool
        """
        return self.get_number_of_consumers() < self.get_number_of_pending_song()

    def song_is_already_transcoded(self, id):
        """Check if the song is already transcoded.

        :param str id: id of the song
        :return: True if the song is already transcoded, False otherwise
        :rtype: bool
        """
        return True if self.db.get_song_representation_data(id) is not None else False

    def update_counters(self):
        for song_id, count in self.counter.items():
            song = self.db.get_song(song_id)

            self.db.update_song_counter(song_id, count)
            self.db.update_release_counter(song.release['id'], count)
            self.db.update_artist_counter(song.artist['id'], count)
