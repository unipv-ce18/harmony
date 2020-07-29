from datetime import datetime, timedelta

from bson import ObjectId


class OrchestratorOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.transcoder = db_connection['transcoder']
        self.modified = db_connection['modified']
        self.consumers = db_connection['consumers']
        self.analyzer = db_connection["analyzer"]

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
        return self.transcoder.count_documents({})

    def put_modified_pending_song(self, song_id, semitones, output_format, split):
        self.modified.insert_one({
            '_id': ObjectId(song_id),
            'semitones': semitones,
            'output_format': output_format,
            'split': split,
            'exp': datetime.utcnow()
        })

    def remove_modified_pending_song(self, song_id):
        self.modified.delete_one({
            '_id': ObjectId(song_id)
        })

    def song_is_modifying(self, song_id, semitones, output_format, split):
        return bool(self.modified.find_one({
            '_id': ObjectId(song_id),
            'semitones': semitones,
            'output_format': output_format,
            'split': split
        }))

    def get_count_modified_collection(self):
        return self.modified.count_documents({})

    def put_analyzer_pending_song(self, song_id):
        self.analyzer.insert_one({
            '_id': ObjectId(song_id),
            'exp': datetime.utcnow()
        })

    def remove_analyzer_pending_song(self, song_id):
        self.analyzer.delete_one({
            '_id': ObjectId(song_id)
        })

    def song_is_analyzing(self, song_id):
        return bool(self.analyzer.find_one({'_id': ObjectId(song_id)}))

    def get_count_analyzing_collection(self):
        return self.analyzer.count_documents({})

    def put_worker(self, consumer_tag, driver_handle):
        """Registers a worker in the database

        :param str consumer_tag: worker identifier used for queue connection
        :param dict driver_handle: additional driver specific data to identify the worker (e.g. PID or container ID)
        """
        self.consumers.insert_one({
            'consumer_tag': consumer_tag,
            'driver_handle': driver_handle,
            'last_work': datetime.utcnow()
        })

    def remove_worker(self, consumer_tag):
        self.consumers.delete_one({
            'consumer_tag': consumer_tag
        })

    def get_count_consumers_collection(self):
        return self.consumers.count_documents({})

    def bind_consumer_to_song(self, consumer_tag, song_id):
        self.consumers.update_one(
            {'consumer_tag': consumer_tag},
            {'$set': {'song_id': song_id}}
        )

    def unbind_consumer_from_song(self, consumer_tag):
        self.consumers.update_one(
            {'consumer_tag': consumer_tag},
            {'$unset': {'song_id': ''},
             '$set': {'last_work': datetime.utcnow()}}
        )

    def get_consumers_to_remove(self, since):
        result = self.consumers.find({
            'song_id': {'$exists': False},
            'last_work': {'$lt': (datetime.utcnow() - timedelta(seconds=since))}
        }, {'_id': 0, 'consumer_tag': 1, 'driver_handle': 1})
        return [res for res in result]
