from datetime import datetime, timedelta

from bson import ObjectId


class DeleteOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.delete = db_connection['delete']

    def put_content_to_delete(self, type, filename):
        content = {
            'type': type,
            'filename': filename,
            'timestamp': datetime.utcnow()
        }
        return str(self.delete.insert_one(content).inserted_id)

    def remove_content_to_delete(self, content_id):
        self.delete.delete_one({
            '_id': ObjectId(content_id)
        })

    def get_contents_to_remove(self, since):
        result = self.delete.find({
            'timestamp': {'$lt': (datetime.utcnow() - timedelta(seconds=since))}
        })
        return [res for res in result]
