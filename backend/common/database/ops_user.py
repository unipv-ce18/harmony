from typing import List, Optional

from bson import ObjectId

from common.model import User
from .contracts import user_contract as c
from .codecs import user_from_document, user_to_document, library_from_document


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
            {c.USER_PASSWORD: 0, c.USER_LIBRARY: 0})
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
        library_doc = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_ID: 0, f'{c.USER_LIBRARY}': 1})
        return library_from_document(library_doc[c.USER_LIBRARY]) if library_doc else None

    def add_media_to_library(self, user_id, media_type, media_id):
        if media_type in [c.LIBRARY_PLAYLISTS, c.LIBRARY_ARTISTS, c.LIBRARY_RELEASES, c.LIBRARY_SONGS]:
            return bool(self.users.update_one(
                {c.USER_ID: ObjectId(user_id)},
                {'$addToSet': {f'{c.USER_LIBRARY}.{media_type}': media_id}}
            ).matched_count)
        return False

    def pull_media_from_library(self, user_id, media_type, media_id):
        if media_type in [c.LIBRARY_PLAYLISTS, c.LIBRARY_ARTISTS, c.LIBRARY_RELEASES, c.LIBRARY_SONGS]:
            return bool(self.users.update_one(
                {c.USER_ID: ObjectId(user_id)},
                {'$pull': {f'{c.USER_LIBRARY}.{media_type}': media_id}}
            ).matched_count)
        return False

    def media_in_library(self, user_id, media_type, media_id):
        if media_type in [c.LIBRARY_PLAYLISTS, c.LIBRARY_ARTISTS, c.LIBRARY_RELEASES, c.LIBRARY_SONGS]:
            return bool(self.users.find_one({
                c.USER_ID: ObjectId(user_id),
                f'{c.USER_LIBRARY}.{media_type}': media_id
            }))
        return False

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
            {'$set': {c.USER_TYPE: c.USER_TYPE_CREATOR}}
        ).matched_count

    def upgrade_pro(self, user_id):
        return self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$set': {c.USER_TIER: c.USER_TIER_PRO}}
        ).matched_count

    def get_user_for_library(self, user_id):
        user_doc = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_USERNAME: 1})
        return user_from_document(user_doc) if user_doc is not None else None

    def get_user_username(self, user_id):
        result = self.users.find_one(
            {c.USER_ID: ObjectId(user_id)},
            {c.USER_ID: 0, c.USER_USERNAME: 1})
        return result[c.USER_USERNAME]

    def update_avatar_url(self, user_id, image_link):
        return self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$set': {c.USER_AVATAR_URL: image_link}}
        ).matched_count

    def update_user_bio(self, user_id, bio):
        return bool(self.users.update_one(
            {c.USER_ID: ObjectId(user_id)},
            {'$set': {c.USER_BIO: bio}}
        ).matched_count)

    def remove_song_from_libraries(self, song_id):
        self.users.update_many(
            {},
            {'$pull': {f'{c.USER_LIBRARY}.{c.LIBRARY_SONGS}': song_id}}
        )

    def remove_release_from_libraries(self, release_id):
        self.users.update_many(
            {},
            {'$pull': {f'{c.USER_LIBRARY}.{c.LIBRARY_RELEASES}': release_id}}
        )
