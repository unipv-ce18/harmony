from multiprocessing import Process
import uuid

import pika

from common.database import Database
from .transcoder_worker import TranscoderWorker
from .config import transcoder_config


class Orchestrator:
    def __init__(self, db_connection):
        """Initialize Orchestrator.

        :param pymongo.database.Database db_connection: database connection instance
        """
        self.db_connection = db_connection
        self.db = Database(self.db_connection)

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
        """Declare the exchange used to receive all the id of the songs to transcode
        from any api server. Declare the durable queue where the messages arrive and
        bind it to the api exchange.
        """
        self.channel.exchange_declare(
            exchange=transcoder_config.QUEUE_EXCHANGE_APISERVER,
            exchange_type='direct'
        )

        self.channel.queue_declare(
            queue=transcoder_config.QUEUE_APISERVER,
            durable=True,
            arguments={'x-message-ttl': 60000}
        )

        self.channel.queue_bind(
            exchange=transcoder_config.QUEUE_EXCHANGE_APISERVER,
            queue=transcoder_config.QUEUE_APISERVER,
            routing_key='id'
        )

    def notification_declare(self):
        """Declare the exchange used to notify the api server."""
        self.channel.exchange_declare(
            exchange=transcoder_config.QUEUE_EXCHANGE_NOTIFICATION,
            exchange_type='direct'
        )

    def producing_declare(self):
        """Declare the exchange used to publish the songs to transcode."""
        self.channel.exchange_declare(
            exchange=transcoder_config.QUEUE_EXCHANGE_TRANSCODER,
            exchange_type='direct'
        )

    def consume(self):
        """Wait for messages from api servers and publish them filtered to
        transcoding exchange.
        """
        self.channel.basic_qos(prefetch_count=5)

        self.channel.basic_consume(
            queue=transcoder_config.QUEUE_APISERVER,
            on_message_callback=self.callback
        )

        self.channel.start_consuming()

    def run(self):
        """Making the Orchestrator run."""
        while True:
            try:
                print('Connection of Orchestrator to RabbitMQ...')

                self.connect()
                self.consuming_declare()
                self.producing_declare()

                print('...made')

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
            exchange=transcoder_config.QUEUE_EXCHANGE_TRANSCODER,
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
            exchange=transcoder_config.QUEUE_EXCHANGE_NOTIFICATION,
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
