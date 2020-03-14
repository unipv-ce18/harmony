import logging
import threading
import uuid

from common.messaging.amq_util import amq_connect_blocking


log = logging.getLogger(__name__)


class NotificationWorker(threading.Thread):

    def __init__(self, song_id, transcoder_client, socketio):
        """Initialize Notification Worker.

        Each instance is a thread.

        :param str song_id: id of the song to be notified
        :param apiserver.ws.transcoder_client.TranscoderClient transcoder_client:
                transcoder client to which this worker is bound
        :param flask_socketio.SocketIO socketio: socketio instance
        """
        threading.Thread.__init__(self)
        self.song_id = song_id
        self.transcoder_client = transcoder_client
        self.socketio = socketio
        self.consumer_tag = uuid.uuid4().hex

        self.connection = amq_connect_blocking(self.transcoder_client.config)
        self.channel = self.connection.channel()

        # Bind the queue of the api server that asked a transcoding to the
        # notification exchange with the routing key equal to the id of the song requested.
        self.channel.queue_bind(
            exchange=self.transcoder_client.config.MESSAGING_EXCHANGE_NOTIFICATION,
            queue=self.transcoder_client.get_local_queue(),
            routing_key=self.song_id
        )
        print('notificator connected')
        log.debug('Started notification worker for song (%s)', song_id)

    def run(self):
        """Wait for the notification."""
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
        log.debug('Received notification: %s', body)
        self.socketio.emit('client', f'{body}')
        ch.basic_cancel(consumer_tag=self.consumer_tag)
