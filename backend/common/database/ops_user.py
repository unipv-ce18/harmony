from bson.objectid import ObjectId


class UserOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.users = db_connection['users']

    def get_user_by_name(self, username):
        query = {'username': username}
        result = self.users.find_one(query)
        return result

    def get_user_by_mail(self, email):
        query = {'email': email}
        result = self.users.find_one(query)
        return result

    def add_user(self, u):
        return self.users.insert_one(u).acknowledged

    def add_users(self, u):
        if self.users.count() != 0:
            for i in range(len(u)):
                self.add_user(u[i])
        else:
            self.users.insert_many(u)

    def search_user(self, user_id):
        query = {'_id': ObjectId(user_id)}
        result = self.users.find_one(query, {'_id': 0})
        return result

    def get_library(self, user_id):
        result = self.users.find_one(
            {'_id': ObjectId(user_id)},
            {'_id': 0, 'prefs.library': 1})
        return result['prefs']['library'] if result else None

    def update_prefs_library(self, user_id, media_type, media_id):
        return bool(self.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$addToSet': {f'prefs.library.{media_type}': media_id}}
        ).matched_count)
