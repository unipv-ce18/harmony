import logging

from flask_socketio import Namespace
from flask import request

from .notification_worker import NotificationWorker
from ..util import security


log = logging.getLogger(__name__)


class PlaybackNamespace(Namespace):
    """Socket.io namespace for media playback"""

    def __init__(self, namespace=None, transcoder_client=None):
        super().__init__(namespace)
        self.transcoder_client = transcoder_client

    def on_connect(self):
        # JWT is sent as query parameter and not in headers so we must check it manually
        try:
            security.verify_jwt_token(request.args.get('access_token'), token_type='access')
            return True
        except Exception as e:
            log.warning('Blocked unauthorized access to playback socket from %s, error: %s', request.remote_addr, e)
            return False  # Reject connection

    def on_hello(self, msg):
        return 'hello back' if msg != 'this is my swamp' else 'it never gets ogre'

    def on_play_song(self, song):
        song_id = song['id']
        log.debug('Received playback request for song %s', song_id)

        # Start async task to wait for notification
        td = NotificationWorker(song_id, self.transcoder_client, self.socketio)
        td.start()

        # Send transcode request
        self.transcoder_client.start_transcode_job(song_id)
