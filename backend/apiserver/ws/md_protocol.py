class MediaDeliveryProtocol:
    """Media Delivery protocol codec and transmission class"""

    ERROR_INVALID_ID = 1
    ERROR_NOT_FOUND = 2
    ERR_JOB_FAILURE = 3

    def __init__(self, socketio, namespace):
        self.socketio = socketio
        self.namespace = namespace

    # noinspection PyMethodMayBeStatic
    def recv_play_song(self, message):
        """Decodes a received "play_song" message

        :param message: The received message
        :return: The song ID
        """
        return message['id']

    def send_manifest(self, song_id, manifest_url):
        """Sends a "manifest" message in response to "play_song"

        :param str song_id: The ID of the song
        :param str manifest_url: The song's manifest URL
        """
        self.socketio.emit('manifest', {'id': song_id, 'manifest_url': manifest_url}, namespace=self.namespace)

    def send_error(self, song_id, error_code):
        """Sends an "md_error" error message

        :param str song_id: The ID of the song the error relates to
        :param str error_code: The error code
        """
        self.socketio.emit('md_error', {'id': song_id, 'error_code': error_code}, namespace=self.namespace)
