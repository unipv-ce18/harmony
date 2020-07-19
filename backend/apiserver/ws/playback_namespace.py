import logging
from typing import Optional

from bson.errors import InvalidId
from flask_socketio import Namespace
from flask import request

from .md_protocol import MediaDeliveryProtocol
from .notification_worker import NotificationWorker
from ..util import security
import common.messaging.jobs as jobs


log = logging.getLogger(__name__)


class PlaybackNamespace(Namespace):
    """Socket.io namespace for media playback"""

    def __init__(self, namespace, transcoder_client, db_interface):
        super().__init__(namespace)
        self.protocol: Optional[MediaDeliveryProtocol] = None
        self.transcoder_client = transcoder_client
        self.db_interface = db_interface

    # noinspection PyMethodMayBeStatic
    def on_connect(self):
        # JWT is sent as query parameter and not in headers, so we must check it manually
        try:
            security.verify_jwt_token(request.args.get('access_token'), token_type='access')
            self.protocol = MediaDeliveryProtocol(self.transcoder_client.config, self.socketio, self.namespace)
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
            repr_data = self._fetch_representation_data(song_id)
        except RuntimeError as e:
            self.protocol.send_error(song_id, e.args[0])
            return

        if repr_data is not None:
            # Already transcoded, send back manifest URL
            self.protocol.send_manifest(song_id, repr_data['manifest'])
            log.debug('Song (%s): Sent manifest', song_id)
        else:
            # Start async task to transcode and wait for notification
            td = NotificationWorker({'song_id': song_id, 'type': jobs.TRANSCODE}, self.transcoder_client, self._transcode_complete_callback)
            td.start()

    def on_get_key(self, msg):
        song_id, key_id = self.protocol.recv_get_key(msg)

        try:
            repr_data = self._fetch_representation_data(song_id)

            # Send NOT_FOUND also if the song was not transcoded, or if the KID does not match
            if repr_data is None:
                log.warning('Song (%s): key requested but no repr_data available', song_id)
                raise RuntimeError(MediaDeliveryProtocol.ERROR_NOT_FOUND)
            if repr_data['key_id'] != key_id:
                log.warning('Song (%s): provided KID "%s" does not match stored "%s"',
                            song_id, key_id, repr_data['key_id'])
                raise RuntimeError(MediaDeliveryProtocol.ERROR_NOT_FOUND)

            self.protocol.send_media_key(song_id, repr_data['key'])
            log.debug('Song (%s): Sent media key', song_id)

        except RuntimeError as e:
            self.protocol.send_error(song_id, e.args[0])

    def on_count_song(self, msg):
        song_id = self.protocol.recv_count_song(msg)

        try:
            _ = self._fetch_representation_data(song_id)
        except RuntimeError as e:
            self.protocol.send_error(song_id, e.args[0])
            return

        td = NotificationWorker({song_id: 1, 'type': jobs.COUNTER}, self.transcoder_client)
        td.start()

    def _fetch_representation_data(self, song_id):
        try:
            return self.db_interface.get_song_representation_data(song_id)
        except InvalidId:
            log.warning('Song (%s): invalid ID', song_id)
            raise RuntimeError(MediaDeliveryProtocol.ERROR_INVALID_ID)
        except ValueError:
            log.warning('Song (%s): not found', song_id)
            raise RuntimeError(MediaDeliveryProtocol.ERROR_NOT_FOUND)

    def _transcode_complete_callback(self, notification_body):
        song_id = notification_body

        repr_data = self.db_interface.get_song_representation_data(song_id)
        if repr_data is not None:
            log.debug('Song (%s): transcode job complete, forwarding to client', song_id)
            self.protocol.send_manifest(song_id, repr_data['manifest'])
        else:
            log.error('Song (%s): transcode complete but no repr data, signaling to client', song_id)
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERR_JOB_FAILURE)
