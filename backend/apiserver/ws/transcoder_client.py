import logging
import pika


log = logging.getLogger(__name__)


class TranscoderClient:
    """AMQP (RabbitMQ) client for transcoding operations"""

    def __init__(self, config):
        self.config = config
        conn_params = pika.ConnectionParameters(
            host=self.config.QUEUE_HOST,
            port=self.config.QUEUE_PORT,
            credentials=pika.PlainCredentials(self.config.QUEUE_USERNAME, self.config.QUEUE_PASSWORD),
            connection_attempts=2, retry_delay=12    # cause Rabbit is slow to start (docker-compose), seriously 12s
        )

        log.debug('Connecting to RabbitMQ...')
        self.connection = pika.BlockingConnection(conn_params)
        self.channel = self.connection.channel()
        self.queue = None

        log.debug('Declaring exchanges...')
        self._configure_server()

        log.debug('Ready')

    def start_transcode_job(self, song_id):
        """Publishes a new transcoding job to the orchestrator queue

        :param str song_id: ID of the song to transcode
        """
        self.channel.basic_publish(
            exchange=self.config.QUEUE_EXCHANGE_APISERVER,
            routing_key='id',
            body=song_id,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        log.info('Sent job for song %s', song_id)

    def get_local_queue(self):
        """Gets the local notification queue for this API server node

        :return: queue name of producer
        :rtype: str
        """
        return self.queue

    def close_connection(self):
        """Close connection to AMQP server"""
        self.connection.close()

    def _configure_server(self):
        # Producer exchange - used by API servers to notify the orchestrator
        self.channel.exchange_declare(
            exchange=self.config.QUEUE_EXCHANGE_APISERVER,
            exchange_type='direct'
        )

        # Notification exchange - to be notified back when a transcoding op finishes
        self.channel.exchange_declare(
            exchange=self.config.QUEUE_EXCHANGE_NOTIFICATION,
            exchange_type='direct'
        )

        # This queue is specific for each API server node
        result = self.channel.queue_declare(
            queue='',
            arguments={'x-message-ttl': 60000}
        )
        self.queue = result.method.queue
