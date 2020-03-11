import logging

from flask_socketio import Namespace

from .notification_worker import NotificationWorker

log = logging.getLogger(__name__)


class PlaybackNamespace(Namespace):
    """Socket.io namespace for media playback"""

    def __init__(self, namespace=None, transcoder_client=None):
        super().__init__(namespace)
        self.transcoder_client = transcoder_client

    def on_play_song(self, song):
        song_id = song['id']
        log.debug('Received playback request for song %s', song_id)

        # Start async task to wait for notification
        td = NotificationWorker(song_id, self.transcoder_client, self.socketio)
        td.start()

        # Send transcode request
        self.transcoder_client.start_transcode_job(song_id)
