from multiprocessing import Process
import uuid

import pika

from common.database import Database
from .transcoder_worker import TranscoderWorker
from .config import config_rabbitmq


class Orchestrator:
    def __init__(self, db_connection):
        self.db_connection = db_connection
        self.db = Database(self.db_connection)

        print('Connection to RabbitMQ...')

        self.connect()
        self.consuming_declare()
        self.producing_declare()

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
            exchange=config_rabbitmq['api_exchange'],
            exchange_type='direct'
        )

        self.channel.queue_declare(
            queue=config_rabbitmq['api_queue'],
            durable=True,
            arguments={'x-message-ttl': 60000}
        )

        self.channel.queue_bind(
            exchange=config_rabbitmq['api_exchange'],
            queue=config_rabbitmq['api_queue'],
            routing_key=config_rabbitmq['routing']
        )

    def producing_declare(self):
        self.channel.exchange_declare(
            exchange=config_rabbitmq['transcoder_exchange'],
            exchange_type='direct'
        )

    def run(self):
        self.channel.basic_qos(prefetch_count=5)

        self.channel.basic_consume(
            queue=config_rabbitmq['api_queue'],
            on_message_callback=self.callback
        )

        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print('\nClosing connection')
            self.connection.close()

    def callback(self, ch, method, properties, body):
        print(f'received {body}')
        id = body.decode('utf-8')

        if not self.song_is_transcoding(id):
            self.push_song_in_queue(id)
            self.store_pending_song(id)
            if self.consumers_less_than_pending_song():
                self.create_worker()

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def push_song_in_queue(self, body):
        self.channel.basic_publish(
            exchange=config_rabbitmq['transcoder_exchange'],
            routing_key=config_rabbitmq['routing'],
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )

    def store_pending_song(self, id):
        self.db.put_transcoder_pending_song(id)

    def get_number_of_pending_song(self):
        return self.db.get_count_transcoder_collection()

    def song_is_transcoding(self, id):
        return self.db.song_is_transcoding(id)

    def create_worker(self):
        consumer_tag = uuid.uuid4().hex
        worker = TranscoderWorker(self.db_connection, consumer_tag)
        self.store_consumer_tag(consumer_tag)
        p = Process(target=worker.consuming)
        p.start()

    def store_consumer_tag(self, consumer_tag):
        self.db.store_consumer_tag(consumer_tag)

    def get_number_of_consumers(self):
        return self.db.get_count_consumers_collection()

    def consumers_less_than_pending_song(self):
        return self.get_number_of_consumers() < self.get_number_of_pending_song()

    def delete_worker(self, consumer_tag):
        self.db.remove_consumer_tag(consumer_tag)
