from datetime import datetime, timedelta

from bson import ObjectId


class UploadOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.upload = db_connection['upload']

    def put_content(self, content_type, content_format):
        content = {
            'content_type': content_type,
            'content_format': content_format,
            'status': 'pending',
            'timestamp': datetime.utcnow()
        }
        return str(self.upload.insert_one(content).inserted_id)

    def remove_content(self, content_id):
        self.upload.delete_one({
            '_id': ObjectId(content_id)
        })

    def mark_complete_upload(self, content_id):
        self.upload.update_one(
            {'_id': ObjectId(content_id)},
            {'$set':
                {'status': 'complete',
                 'timestamp': datetime.utcnow()}
            }
        )

    def get_contents_to_remove(self, since):
        result = self.upload.find({
            'timestamp': {'$lt': (datetime.utcnow() - timedelta(seconds=since))}
        }, {'_id': 1, 'content_type': 1, 'content_format': 1})
        return [res for res in result]
