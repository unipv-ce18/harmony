import threading
import uuid


class NotificationWorker(threading.Thread):
    def __init__(self, id, transcoder_client, socketio):
        """Initialize Notification Worker.

        Each instance is a thread.

        :param str queue: specific queue of the api server from where the thread
            is created.
        :param str id: id of the song to be notified
        :param flask_socketio.SocketIO socketio: socketio instance
        """
        threading.Thread.__init__(self)
        self.id = id
        self.transcoder_client = transcoder_client
        self.socketio = socketio

        print('Connection to RabbitMQ...')

        self.connect()
        self.notification_declare()

        print('...made')

    def connect(self):
        """Connect to RabbitMQ."""
        #params = pika.ConnectionParameters(
        #    host=self.transcoder_client.config.QUEUE_HOST,
        #    port=self.transcoder_client.config.QUEUE_PORT,
        #    credentials=pika.PlainCredentials(
        #        self.transcoder_client.config.QUEUE_USERNAME,
        #        self.transcoder_client.config.QUEUE_PASSWORD
        #    )
        #)
        #self.connection = pika.BlockingConnection(params)
        #self.channel = self.connection.channel()

        # TODO: Check if this works
        self.connection = self.transcoder_client.connection
        self.channel = self.transcoder_client.channel

    def notification_declare(self):
        """Bind the queue of the api server that asked a transcoding to
        the notification exchange with the routing key equal to the id of the
        song requested.
        """
        self.channel.queue_bind(
            exchange= self.transcoder_client.config.QUEUE_EXCHANGE_NOTIFICATION,
            queue=self.transcoder_client.get_local_queue(),
            routing_key=self.id
        )

    def run(self):
        """Wait for the notification."""
        self.consumer_tag = uuid.uuid4().hex

        self.channel.basic_consume(
            queue=self.transcoder_client.get_local_queue(),
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
        self.socketio.emit('client', f'{body}')
        print('sent to client')
        ch.basic_cancel(consumer_tag=self.consumer_tag)
