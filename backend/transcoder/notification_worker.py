import threading
import uuid

import pika

from .config import config_rabbitmq


class NotificationWorker(threading.Thread):
    def __init__(self, queue, id):
        """Initialize Notification Worker.

        Each instance is a thread.

        :param str queue: specific queue of the api server from where the thread
            is created.
        :param str id: id of the song to be notified
        """
        threading.Thread.__init__(self)
        self.queue = queue
        self.id = id

        print('Connection to RabbitMQ...')

        self.connect()
        self.notification_declare()

        print('...made')

    def connect(self):
        """Connect to RabbitMQ."""
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
        """Bind the queue of the api server that asked a transcoding to
        the notification exchange with the routing key equal to the id of the
        song requested.
        """
        self.channel.queue_bind(
            exchange=config_rabbitmq['notification_exchange'],
            queue=self.queue,
            routing_key=self.id
        )

    def run(self):
        """Wait for the notification."""
        self.consumer_tag = uuid.uuid4().hex

        self.channel.basic_consume(
            queue=self.queue,
            on_message_callback=self.callback,
            auto_ack=True,
            consumer_tag=self.consumer_tag
        )

        self.channel.start_consuming()

    def callback(self, ch, method, properties, body):
        """Callback function.

        When the message arrives, it prints it, then the worker cancel itself.

        :param pika.adapters.blocking_connection.BlockingChannel ch: channel
        :param bytes body: the body of the message, i.e. the id of the transcoded
            song
        """
        print(f'received {body}')
        ch.basic_cancel(consumer_tag=self.consumer_tag)
