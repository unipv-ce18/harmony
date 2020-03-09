from flask_socketio import Namespace

from .notification_worker import NotificationWorker


class TranscodeNamespace(Namespace):
    def __init__(self, namespace=None, socketio=None, producer=None, queue=None):
        super(TranscodeNamespace, self).__init__(namespace)
        self.socketio = socketio
        self.producer = producer
        self.queue = queue

    def on_play_song(self, song):
        id = song['id']
        print(f'received {id}')
        td = NotificationWorker(self.queue, id, self.socketio)
        td.start()
        self.producer.add_to_queue(id)
