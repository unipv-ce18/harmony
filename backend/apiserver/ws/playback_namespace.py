import logging

from flask_socketio import Namespace

from apiserver.ws.transcoder_client import TranscoderClient
from apiserver.ws.notification_worker import NotificationWorker

log = logging.getLogger(__name__)


class PlaybackNamespace(Namespace):
    """Socket.io namespace for media playback"""

    def __init__(self, namespace=None, socketio=None, producer: TranscoderClient = None):
        super().__init__(namespace)
        self.socketio = socketio
        self.producer = producer

    def on_play_song(self, song):
        song_id = song['id']
        log.debug('Received playback request for song %s', song_id)
        td = NotificationWorker(self.producer.get_local_queue(), song_id, self.socketio)
        td.start()
        self.producer.start_transcode_job(song_id)
