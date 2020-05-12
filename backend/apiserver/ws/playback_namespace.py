import logging

from bson.errors import InvalidId
from flask_socketio import Namespace
from flask import request

from .md_protocol import MediaDeliveryProtocol
from .notification_worker import NotificationWorker
from ..util import security


log = logging.getLogger(__name__)


class PlaybackNamespace(Namespace):
    """Socket.io namespace for media playback"""

    def __init__(self, namespace, transcoder_client, db_interface):
        super().__init__(namespace)
        self.transcoder_client = transcoder_client
        self.db_interface = db_interface
        self.protocol = None

    # noinspection PyMethodMayBeStatic
    def on_connect(self):
        # JWT is sent as query parameter and not in headers, so we must check it manually
        try:
            security.verify_jwt_token(request.args.get('access_token'), token_type='access')
            self.protocol = MediaDeliveryProtocol(self.socketio, self.namespace)
            return True
        except Exception as e:
            log.warning('Blocked unauthorized access to playback socket from %s, error: %s', request.remote_addr, e)
            return False  # Reject connection

    # noinspection PyMethodMayBeStatic
    def on_hello(self, msg):
        return 'hello back' if msg != 'this is my swamp' else 'it never gets ogre'

    def on_play_song(self, msg):
        song_id = self.protocol.recv_play_song(msg)

        try:
            repr_data = self.db_interface.get_song_representation_data(song_id)
        except InvalidId:
            log.warning('Song (%s): invalid ID', song_id)
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERROR_INVALID_ID)
            return
        except ValueError:
            log.warning('Song (%s): not found', song_id)
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERROR_NOT_FOUND)
            return

        if repr_data is not None:
            # Already transcoded, send back manifest URL
            self.protocol.send_manifest(song_id, repr_data['manifest'])
            log.debug('Song (%s): Sent manifest', song_id)
            return

        # Start async task to transcode and wait for notification
        td = NotificationWorker(song_id, self.transcoder_client, self._transcode_complete_callback)
        td.start()

        # Send transcode request
        self.transcoder_client.start_transcode_job(song_id)
        log.debug('Song (%s): Enqueued for transcoding', song_id)

    def _transcode_complete_callback(self, notification_body):
        song_id = notification_body

        repr_data = self.db_interface.get_song_representation_data(song_id)
        if repr_data is not None:
            log.debug('Song (%s): transcode job complete, forwarding to client', song_id)
            self.protocol.send_manifest(song_id, repr_data['manifest'])

        else:
            log.error('Song (%s): transcode complete but no repr data, signaling to client', song_id)
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERR_JOB_FAILURE)
