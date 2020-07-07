from datetime import datetime, timedelta

from bson import ObjectId


class UploadOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.upload = db_connection['upload']

    def put_content(self, category, category_id, mimetype):
        content = {
            'category': category,
            'category_id': category_id,
            'mimetype': mimetype,
            'status': 'pending',
            'timestamp': datetime.utcnow()
        }
        return str(self.upload.insert_one(content).inserted_id)

    def get_content(self, content_id):
        return self.upload.find_one(
            {'_id': ObjectId(content_id)}
        )

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
        }, {'_id': 1, 'mimetype': 1})
        return [res for res in result]

    def get_content_status(self, content_id):
        result = self.upload.find_one(
            {'_id': ObjectId(content_id)},
            {'_id': 0, 'status': 1}
        )
        return result['status']
