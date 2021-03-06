import logging
import uuid
import json

import pika
from pika.exceptions import ChannelClosedByBroker

from common.messaging.amq_util import amq_connect_blocking, amq_orchestrator_declaration
import common.messaging.jobs as jobs
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
        self.channel.basic_qos(prefetch_count=director_config.PREFETCH_COUNT)

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

    def transcode_callback(self, ch, method, properties, message):
        """Transcode callback.

        When the message arrives, check if the song is already in transcoding;
        if yes, just send an ack to api server, otherwise publish the song id
        to the transcoder exchange, store the id of the song inside database,
        check if the consumers are less than the messages inside the queue and if
        so create a new transcoder worker.
        """
        song_id = message['song_id']
        log.info('%s: Received transcode request', song_id)

        if not self.song_is_already_transcoded(song_id):
            if not self.song_is_transcoding(song_id):
                self.push_song_in_queue(message)
                self.store_transcode_pending_song(song_id)
                if self.consumers_less_than_pending_song():
                    self.create_worker()
            else:
                log.debug('%s: Duplicate request, ignoring', song_id)
        else:
            self.notify_api_server(song_id)
            log.debug('%s: Already converted, notification sent', song_id)

    def modify_song_callback(self, ch, method, properties, message):
        """Modify song callback."""
        song_id = message['song_id']
        semitones = message['semitones']
        output_format = message['output_format']
        split = message['split']
        log.info('%s: Received modify song request', song_id)

        if not self.song_is_already_modified(song_id, semitones, output_format, split):
            if not self.song_is_modifying(song_id, semitones, output_format, split):
                self.push_song_in_queue(message)
                self.store_modified_pending_song(song_id, semitones, output_format, split)
                if self.consumers_less_than_pending_song():
                    self.create_worker()
            else:
                log.debug('%s: Duplicate request, ignoring', song_id)
        else:
            self.notify_api_server(song_id)
            log.debug('%s: Already modified, notification sent', song_id)

    def analysis_callback(self, ch, method, properties, message):
        """Analysis callback."""
        song_id = message['song_id']
        log.info('%s: Received analysis song request', song_id)
        if not self.song_is_already_analyzed(song_id):
            if not self.song_is_analyzing(song_id):
                self.push_song_in_queue(message)
                self.store_analyzing_pending_song(song_id)
                if self.consumers_less_than_pending_song():
                    self.create_worker()
            else:
                log.debug('%s: Duplicate request, ignoring', song_id)
        else:
            self.notify_api_server(song_id)
            log.debug('%s: Already analyzed, notification sent', song_id)

    def counter_callback(self, ch, method, properties, message):
        """Counter callback."""
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

    def callback(self, ch, method, properties, body):
        """Callback function.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message
        """
        message = json.loads(body.decode('utf-8'))

        if message['type'] == jobs.TRANSCODE:
            self.transcode_callback(ch, method, properties, message)

        if message['type'] == jobs.MODIFY_SONG:
            self.modify_song_callback(ch, method, properties, message)

        if message['type'] == jobs.ANALYSIS:
            self.analysis_callback(ch, method, properties, message)

        if message['type'] == jobs.COUNTER:
            self.counter_callback(ch, method, properties, message)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def push_song_in_queue(self, message):
        """Publish message to worker exchange.

        :param dict message: message to send
        """
        self.channel.basic_publish(
            exchange=director_config.MESSAGING_EXCHANGE_WORKER,
            routing_key='id',
            body=json.dumps(message),
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

    def store_transcode_pending_song(self, id):
        """Store id of a song in transcoding in database.

        :param str id: id of the song
        """
        self.db.put_transcoder_pending_song(id)

    def get_number_of_transcode_pending_song(self):
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

    def song_is_already_analyzed(self, song_id):
        """Check if a song has already been analyzed.

        :param str song_id: id of the song
        :return: True if exist data analysis related to the song, False otherwise
        :rtype: bool
        """
        song = self.db.get_song(song_id)
        return song is not None and song.anal_data is not None

    def song_is_analyzing(self, song_id):
        """Check if a song is already in the analysis process.

        :param str song_id: id of the song
        :rtype: bool
        """
        return self.db.song_is_analyzing(song_id)

    def store_analyzing_pending_song(self, song_id):
        """Store id of a song to analyze in database.

        :param str song_id: id of the song
        """
        self.db.put_analyzer_pending_song(song_id)

    def get_number_of_analyzing_pending_song(self):
        """Get the number of songs in analyzing queue.

        :return: number of pending songs
        :rtype: int
        """
        return self.db.get_count_analyzing_collection()

    def song_is_already_modified(self, song_id, semitones, output_format, split):
        """Check if a song has already been shifted with the same features.

        :param str song_id: id of the song
        :param float semitones: semitones to shift
        :param str output_format: the output format
        :param bool split: if True, split the song
        :return: True if exist this changed pitch version of the song, False otherwise
        :rtype: bool
        """
        song = self.db.get_song(song_id)
        if song.versions is not None:
            for v in song.versions:
                if v['semitones'] == semitones and v['output_format'] == output_format and v['split'] == split:
                    return True
        return False

    def song_is_modifying(self, song_id, semitones, output_format, split):
        """Check if a song has been modifying with the same features.

        :param str song_id: id of the song
        :param float semitones: semitones to shift
        :param str output_format: the output format
        :param bool split: whether or not to split the song
        :return: True if this version of the song is creating now, False otherwise
        :rtype: bool
        """
        return self.db.song_is_modifying(song_id, semitones, output_format, split)

    def store_modified_pending_song(self, song_id, semitones, output_format, split):
        """Store id of a song to modify in database.

        :param str song_id: id of the song
        :param float semitones: semitones to shift
        :param str output_format: the output format
        :param bool split: whether or not to split the song
        """
        self.db.put_modified_pending_song(song_id, semitones, output_format, split)

    def get_number_of_modified_pending_song(self):
        """Get the number of songs in modified queue.

        :return: number of pending songs
        :rtype: int
        """
        return self.db.get_count_modified_collection()

    def consumers_less_than_pending_song(self):
        """Check if the consumers are less than the number of messages in queue.

        :return: True if consumers are less than messages, False otherwise
        :rtype: bool
        """
        return self.get_number_of_consumers() < (self.get_number_of_transcode_pending_song()
                                                 + self.get_number_of_modified_pending_song()
                                                 + self.get_number_of_analyzing_pending_song())

    def song_is_already_transcoded(self, id):
        """Check if the song is already transcoded.

        :param str id: id of the song
        :return: True if the song is already transcoded, False otherwise
        :rtype: bool
        """
        return True if self.db.get_song_representation_data(id) is not None else False

    def update_counters(self):
        """Update the song, release and artist counters."""
        for song_id, count in self.counter.items():
            song = self.db.get_song(song_id)

            self.db.update_song_counter(song_id, count)
            self.db.update_release_counter(song.release['id'], count)
            self.db.update_artist_counter(song.artist['id'], count)
