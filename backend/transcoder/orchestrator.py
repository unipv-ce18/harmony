import logging
from multiprocessing import Process
import uuid

import pika

from common.database import Database
from common.messaging.amq_util import machine_id, amq_connect_blocking
from .transcoder_worker import TranscoderWorker
from .config import transcoder_config


log = logging.getLogger(__name__)


class Orchestrator:
    def __init__(self, db_connection):
        """Initialize Orchestrator.

        :param pymongo.database.Database db_connection: database connection instance
        """
        self.queue_name = f'orchestrator-{machine_id}'

        self.db_connection = db_connection
        self.db = Database(self.db_connection)
        self.connection = None
        self.channel = None

    def consume(self):
        """Wait for messages from api servers and publish them filtered to transcoding exchange."""
        self.channel.basic_qos(prefetch_count=5)
        self.channel.basic_consume(self.queue_name, self.callback)

        self.channel.start_consuming()

    def run(self):
        """Making the Orchestrator run."""
        while True:
            try:
                self.connection = amq_connect_blocking(transcoder_config)
                self.channel = self.connection.channel()
                log.debug('Connected to RabbitMQ')

                # Create the incoming jobs queue and bind it to the global jobs exchange (where API servers publish)
                self.channel.queue_declare(self.queue_name, durable=True, arguments={'x-message-ttl': 60000})
                self.channel.queue_bind(exchange=transcoder_config.MESSAGING_EXCHANGE_JOBS,
                                        queue=self.queue_name,
                                        routing_key='id')
                log.debug('Orchestrator queue "%s" created and bound to exchange "%s"',
                          self.queue_name, transcoder_config.MESSAGING_EXCHANGE_JOBS)

                self.consume()

            except KeyboardInterrupt:
                print('\nClosing connection')
                self.connection.close()
                break
            except:
                continue

    def callback(self, ch, method, properties, body):
        """Callback function.

        When the message arrives, check if the song is already in transcoding;
        if yes, just send an ack to api server, otherwise publish the song id
        to the transcoder exchange, store the id of the song inside database,
        check if the consumers are less than the messages inside the queue and if
        so create a new transcoder worker.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message, i.e. the id of the song to
            transcode
        """
        print(f'received {body}')
        id = body.decode('utf-8')

        if not self.song_is_already_transcoded(id):
            if not self.song_is_transcoding(id):
                self.push_song_in_queue(id)
                self.store_pending_song(id)
                if self.consumers_less_than_pending_song():
                    self.create_worker()
        else:
            self.notify_api_server(id)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def push_song_in_queue(self, id):
        """Publish song id to transcoder exchange.

        :param str id: id of the song
        """
        self.channel.basic_publish(
            exchange=transcoder_config.MESSAGING_EXCHANGE_WORKER,
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
        print(f'{id} already transcoded')
        self.channel.basic_publish(
            exchange=transcoder_config.MESSAGING_EXCHANGE_NOTIFICATION,
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
        worker = TranscoderWorker(self.db_connection, consumer_tag)
        self.store_consumer_tag(consumer_tag)
        p = Process(target=worker.consuming)
        p.start()

    def store_consumer_tag(self, consumer_tag):
        """Store the consumer tag inside database."""
        self.db.store_consumer_tag(consumer_tag)

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
