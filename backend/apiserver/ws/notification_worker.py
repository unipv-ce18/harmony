import logging
import threading
import uuid
import json

import pika

from common.messaging.amq_util import amq_connect_blocking
import common.messaging.jobs as jobs


log = logging.getLogger(__name__)


class NotificationWorker(threading.Thread):

    def __init__(self, message, amqp_client, callback_fn=None):
        """Initialize Notification Worker.

        Each instance is a thread.

        :param str song_id: id of the song to be notified
        :param apiserver.ws.amqp_client.AmqpClient amqp_client:
               amqp client to which this worker is bound
        :param callback_fn: function to call when the notification is received
        """
        threading.Thread.__init__(self)
        self.message = message
        self.song_id = list(self.message.keys())[0] if self.message['type'] == jobs.COUNTER else self.message['song_id']
        self.amqp_client = amqp_client
        self.callback_fn = callback_fn
        self.consumer_tag = uuid.uuid4().hex

        self.connection = amq_connect_blocking(self.amqp_client.config)
        self.channel = self.connection.channel()

        # Bind the queue of the api server that asked a transcoding to the
        # notification exchange with the routing key equal to the id of the song requested.
        self.channel.queue_bind(
            exchange=self.amqp_client.config.MESSAGING_EXCHANGE_NOTIFICATION,
            queue=self.amqp_client.get_local_queue(),
            routing_key=self.song_id
        )
        log.debug('Started notification worker for song (%s)', self.song_id)

        # Send message request
        self.send_message(self.message)
        log.debug('Song (%s): Enqueued for "%s"', self.song_id, self.message['type'])

    def send_message(self, message):
        """Publishes a new job to the orchestrator queue

        :param dict message: message
        """
        self.channel.basic_publish(
            exchange=self.amqp_client.config.MESSAGING_EXCHANGE_JOBS,
            routing_key='id',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        log.info('Sent job for song (%s)', self.song_id)

    def run(self):
        """Wait for the notification."""
        self.channel.basic_consume(
            queue=self.amqp_client.get_local_queue(),
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
        data = body.decode('utf-8')
        log.debug('Received notification: %s', data)
        if self.callback_fn is not None:
            self.callback_fn(data)
        ch.basic_cancel(consumer_tag=self.consumer_tag)
