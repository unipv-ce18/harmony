import pika

from .config import config_rabbitmq


class TranscoderProducer:
    def __init__(self):
        print('Connection to RabbitMQ...')

        params = pika.ConnectionParameters(host=config_rabbitmq['host'])
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

        self.channel.exchange_declare(
            exchange=config_rabbitmq['exchange'],
            exchange_type='direct'
        )

        print('...made')

    def add_to_queue(self, id):
        self.channel.basic_publish(
            exchange=config_rabbitmq['exchange'],
            routing_key=config_rabbitmq['routing'],
            body=id,
            properties=pika.BasicProperties(
                delivery_mode = 2,
            )
        )
        print(f'sent {id}')
        self.connection.close()
