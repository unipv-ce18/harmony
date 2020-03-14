import logging

import pika

from common.messaging.amq_util import amq_connect_blocking, amq_producer_declaration


log = logging.getLogger(__name__)


class TranscoderClient:
    """AMQP (RabbitMQ) client for transcoding operations"""

    def __init__(self, config):
        self.config = config

        self.connection = amq_connect_blocking(config)
        self.channel = self.connection.channel()
        log.debug('Connected to RabbitMQ')

        # Create a queue for this API server node, used to receive notifications
        self.queue_name = amq_producer_declaration(self.channel, config)
        log.debug('Notification queue "%s" created', self.queue_name)

    def start_transcode_job(self, song_id):
        """Publishes a new transcoding job to the orchestrator queue

        :param str song_id: ID of the song to transcode
        """
        self.channel.basic_publish(
            exchange=self.config.MESSAGING_EXCHANGE_JOBS,
            routing_key='id',
            body=song_id,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        log.info('Sent job for song (%s)', song_id)

    def get_local_queue(self):
        """Gets the local notification queue for this API server node

        :return: queue name of producer
        :rtype: str
        """
        return self.queue_name

    def close_connection(self):
        """Close connection to AMQP server"""
        self.connection.close()
