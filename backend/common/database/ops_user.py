from typing import List, Optional

from bson import ObjectId

from common.model import User
from .contracts import user_contract as c
from .codecs import user_from_document, user_to_document


class UserOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.users = db_connection[c.COLLECTION_NAME]

    def put_user(self, user: User) -> str:
        """Inserts a user into the database and returns its new ID"""
        user_data = user_to_document(user, strip_unsafe=True)
        return str(self.users.insert_one(user_data).inserted_id)

    def put_users(self, users: List[User]) -> List[str]:
        """Inserts more users at once"""
        return [self.put_user(users[i]) for i in range(len(users))]

    def get_user(self, user_id):
        user_doc = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_PASSWORD: 0, c.USER_PREFS: 0})
        return user_from_document(user_doc) if user_doc is not None else None

    def get_user_by_name(self, username):
        user_doc = self.users.find_one(
            {c.USER_USERNAME: username})
        return user_from_document(user_doc) if user_doc is not None else None

    def get_user_by_mail(self, email):
        user_doc = self.users.find_one(
            {c.USER_EMAIL: email})
        return user_from_document(user_doc) if user_doc is not None else None

    def get_library(self, user_id):
        result = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_ID: 0, f'{c.USER_PREFS}.library': 1})
        return result[c.USER_PREFS]['library'] if result else None

    def add_media_to_library(self, user_id, media_type, media_id):
        return bool(self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$addToSet': {f'{c.USER_PREFS}.library.{media_type}': media_id}}
        ).matched_count)

    def pull_media_from_library(self, user_id, media_type, media_id):
        return bool(self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$pull': {f'{c.USER_PREFS}.library.{media_type}': media_id}}
        ).matched_count)

    def media_in_library(self, user_id, media_type, media_id):
        return bool(self.users.find_one({
            c.USER_ID: ObjectId(user_id),
            f'{c.USER_PREFS}.library.{media_type}': media_id
        }))

    def get_user_type(self, user_id):
        result = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_ID: 0, c.USER_TYPE: 1})
        return result[c.USER_TYPE]

    def get_user_tier(self, user_id):
        result = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_ID: 0, c.USER_TIER: 1})
        return result[c.USER_TIER]

    def upgrade_creator(self, user_id):
        return self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$set': {c.USER_TYPE: 'creator'}}
        ).matched_count

    def upgrade_pro(self, user_id):
        return self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$set': {c.USER_TIER: 'pro'}}
        ).matched_count

    def get_user_for_library(self, user_id):
        user_doc = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_USERNAME: 1})
        return user_from_document(user_doc) if user_doc is not None else None
