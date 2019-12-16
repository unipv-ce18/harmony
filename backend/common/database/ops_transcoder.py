from datetime import datetime

from bson import ObjectId


class TranscoderOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.transcoder = db_connection['transcoder']

    def put_transcoder_pending_song(self, song_id):
        self.transcoder.insert_one({
            '_id': ObjectId(song_id),
            'exp': datetime.utcnow()
        })

    def remove_transcoder_pending_song(self, song_id):
        self.transcoder.delete_one({
            '_id': ObjectId(song_id)
        })

    def song_is_transcoding(self, song_id):
        return bool(self.transcoder.find_one({'_id': ObjectId(song_id)}))
