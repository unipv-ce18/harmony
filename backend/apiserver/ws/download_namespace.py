import logging
from typing import Optional

from bson import ObjectId
from flask_socketio import Namespace
from flask import request

from .md_protocol import MediaDeliveryProtocol
from .notification_worker import NotificationWorker
from ..util import security
from common.database.contracts import user_contract as c
from common.storage import get_storage_base_url
import common.messaging.jobs as jobs


log = logging.getLogger(__name__)


class DownloadNamespace(Namespace):
    """Socket.io namespace for download"""

    def __init__(self, namespace, amqp_client, db_interface):
        super().__init__(namespace)
        self.protocol: Optional[MediaDeliveryProtocol] = None
        self.amqp_client = amqp_client
        self.db_interface = db_interface

    def on_connect(self):
        # JWT is sent as query parameter and not in headers, so we must check it manually
        try:
            security.verify_jwt_token(request.args.get('access_token'), token_type='access')
            self.protocol = MediaDeliveryProtocol(self.amqp_client.config, self.socketio, self.namespace)
            return True
        except Exception as e:
            log.warning('Blocked unauthorized access to playback socket from %s, error: %s', request.remote_addr, e)
            return False  # Reject connection

    def on_modify_song(self, msg):
        song_id, semitones, output_format, split = self.protocol.recv_modify_song(msg)

        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            self.protocol.send_error(user_id, MediaDeliveryProtocol.ERROR_INVALID_ID)
            return

        if not ObjectId.is_valid(song_id):
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERROR_INVALID_ID)
            return

        if self.db_interface.get_user_tier(user_id) != c.USER_TIER_PRO:
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERR_UNAUTHORIZED)
            return

        song = self.db_interface.get_song(song_id)
        if song is None:
            self.protocol.send_error(song_id, MediaDeliveryProtocol.ERROR_NOT_FOUND)
            return

        filename = _file_to_download(song_id)
        if filename is not None:
            self.protocol.send_url_modified_song(filename)
            log.debug('Song (%s): Sent url for requested version', song_id)
        else:
            message = {
                'song_id': song_id,
                'semitones': semitones,
                'output_format': output_format,
                'split': split,
                'type': jobs.MODIFY_SONG
            }
            td = NotificationWorker(message, self.amqp_client, self._modify_song_callback)
            td.start()

    def _file_to_download(self, song_id):
        song = self.db_interface.get_song(song_id)
        if song.versions is not None:
            for v in song.versions:
                if v['semitones'] == semitones and v['output_format'] == output_format and v['split'] == split:
                    return v['filename']
        return None

    def _modify_song_callback(self, notification_body):
        song_id = notification_body

        filename = _file_to_download(song_id)
        if filename is not None:
            log.debug('Song (%s): modify song job complete, forwarding to client', song_id)
            self.protocol.send_url_modified_song(filename)

        log.error('Song (%s): something went wrong during the modifying process, signaling to client', song_id)
        self.protocol.send_error(song_id, MediaDeliveryProtocol.ERR_JOB_FAILURE)
