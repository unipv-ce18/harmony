import threading
import uuid

import pika

from .config import config_rabbitmq


class TranscoderWorkerNotification(threading.Thread):
    def __init__(self, queue, id):
        threading.Thread.__init__(self)
        self.queue = queue
        self.id = id

        print('Connection to RabbitMQ...')

        self.connect()
        self.notification_declare()

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

    def notification_declare(self):
        self.channel.queue_bind(
            exchange=config_rabbitmq['notification_exchange'],
            queue=self.queue,
            routing_key=self.id
        )

    def run(self):
        self.consumer_tag = uuid.uuid4().hex

        self.channel.basic_consume(
            queue=self.queue,
            on_message_callback=self.callback,
            auto_ack=True,
            consumer_tag=self.consumer_tag
        )

        self.channel.start_consuming()

    def callback(self, ch, method, properties, body):
        print(f'received {body}')
        ch.basic_cancel(consumer_tag=self.consumer_tag)
