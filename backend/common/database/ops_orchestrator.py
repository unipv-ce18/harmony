from datetime import datetime

from bson import ObjectId


class OrchestratorOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.transcoder = db_connection['transcoder']
        self.consumers = db_connection['consumers']

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

    def get_count_transcoder_collection(self):
        return self.transcoder.count_documents()

    def store_consumer_tag(self, consumer_tag):
        self.consumers.insert_one({
            'consumer_tag': consumer_tag
        })

    def remove_consumer_tag(self, consumer_tag):
        self.consumers.delete_one({
            'consumer_tag': consumer_tag
        })

    def get_count_consumers_collection(self):
        return self.consumers.count_documents()
