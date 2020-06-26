from bson import ObjectId


class UploadOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.upload = db_connection['upload']

    def put_content(self, content_type):
        content = {
            'content_type': content_type
        }
        return str(self.upload.insert_one(content).inserted_id)
