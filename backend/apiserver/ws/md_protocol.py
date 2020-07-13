from common.storage import get_storage_base_url


# noinspection PyMethodMayBeStatic
class MediaDeliveryProtocol:
    """Media Delivery protocol codec and transmission class"""

    ERROR_INVALID_ID = 1
    ERROR_NOT_FOUND = 2
    ERR_JOB_FAILURE = 3

    def __init__(self, config, socketio, namespace):
        self.socketio = socketio
        self.namespace = namespace
        self.transcoded_songs_bucket_url = get_storage_base_url(config) + config.STORAGE_BUCKET_TRANSCODED

    def recv_play_song(self, message):
        """Decodes a received "play_song" message"""
        return message['id']

    def recv_get_key(self, message):
        """Decodes a received "get_key" message """
        return message['id'], message['kid']

    def recv_count_song(self, message):
        """Decodes a received "count_song" message"""
        return message['id']

    def send_manifest(self, song_id, manifest_path):
        """Sends a "manifest" message in response to "play_song"

        :param str song_id: The ID of the song
        :param str manifest_path: The song's manifest path from representation data
        """
        manifest_url = f'{self.transcoded_songs_bucket_url}/{manifest_path}'
        self.socketio.emit('manifest', {'id': song_id, 'manifest_url': manifest_url}, namespace=self.namespace)

    def send_media_key(self, song_id, key):
        """Sends a "media_key" message to answer "get_key"

        :param str song_id: The ID of the song
        :param str key: The EME key encoded as a hex string
        """
        self.socketio.emit('media_key', {'id': song_id, 'key': key}, namespace=self.namespace)

    def send_error(self, song_id, error_code):
        """Sends an "md_error" error message

        :param str song_id: The ID of the song the error relates to
        :param str error_code: The error code
        """
        self.socketio.emit('md_error', {'id': song_id, 'error_code': error_code}, namespace=self.namespace)
