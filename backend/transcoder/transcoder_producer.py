import pika

from .config import config_rabbitmq


class TranscoderProducer:
    def __init__(self):
        """Initialize Transcoder Producer."""
        print('Connection of Producer to RabbitMQ...')

        self.connect()
        self.producing_declare()
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

    def producing_declare(self):
        """Declare the exchange used by api server to notify the orchestrator."""
        self.channel.exchange_declare(
            exchange=config_rabbitmq['api_exchange'],
            exchange_type='direct'
        )

    def notification_declare(self):
        """Declare the exchange used by instances of api servers to receive the
        notification back when a requested transoding is finished.
        The queue is specific of each api server.
        """
        self.channel.exchange_declare(
            exchange=config_rabbitmq['notification_exchange'],
            exchange_type='direct'
        )

        result = self.channel.queue_declare(
                     queue='',
                     arguments={'x-message-ttl': 60000}
                 )
        self.queue = result.method.queue

    def add_to_queue(self, id):
        """Publish to api exchange the id of the song to transcode.

        :param str id: id of the song
        """
        self.channel.basic_publish(
            exchange=config_rabbitmq['api_exchange'],
            routing_key=config_rabbitmq['routing'],
            body=id,
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )
        print(f'sent {id}')

    def get_queue(self):
        """Get the specific queue of the producer.

        :return: queue name of producer
        :rtype: str
        """
        return self.queue

    def close_connection(self):
        """Close connection to RabbitMQ."""
        self.connection.close()
