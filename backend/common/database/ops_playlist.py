from typing import List, Optional

from bson import ObjectId

from common.model import Playlist
from .contracts import playlist_contract as c
from .codecs import playlist_from_document, playlist_to_document


class PlaylistOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.playlists = db_connection[c.COLLECTION_NAME]

    def put_playlist(self, playlist: Playlist) -> str:
        """Inserts a playlist into the database and returns its new ID"""
        playlist_data = playlist_to_document(playlist, strip_unsafe=True)
        return str(self.playlists.insert_one(playlist_data).inserted_id)

    def add_song_to_playlist(self, playlist_id, song_id):
        return bool(self.playlists.update_one(
            {c.PLAYLIST_ID: ObjectId(playlist_id)},
            {'$addToSet': {c.PLAYLIST_SONGS: song_id}}
        ).matched_count)

    def pull_song_from_playlist(self, playlist_id, song_id):
        return bool(self.playlists.update_one(
            {c.PLAYLIST_ID: ObjectId(playlist_id)},
            {'$pull': {c.PLAYLIST_SONGS: song_id}}
        ).matched_count)

    def get_playlist_creator(self, playlist_id):
        playlist_doc = self.playlists.find_one(
            {c.PLAYLIST_ID: ObjectId(playlist_id)},
            {c.PLAYLIST_ID: 0, c.PLAYLIST_CREATOR: 1})
        return playlist_doc[c.PLAYLIST_CREATOR][c.PLAYLIST_CREATOR_ID] if playlist_doc else None

    def get_playlist(self, playlist_id):
        playlist_doc = self.playlists.find_one({c.PLAYLIST_ID: ObjectId(playlist_id)})
        return playlist_from_document(playlist_doc) if playlist_doc is not None else None

    def get_playlist_for_library(self, playlist_id):
        playlist_doc = self.playlists.find_one(
            {c.PLAYLIST_ID: ObjectId(playlist_id)},
            {c.PLAYLIST_SONGS: 0}
        )
        return playlist_from_document(playlist_doc) if playlist_doc is not None else None

    def song_in_playlist(self, playlist_id, song_id):
        return bool(self.playlists.find_one({
            c.PLAYLIST_ID: ObjectId(playlist_id),
            c.PLAYLIST_SONGS: song_id
        }))

    def search_playlist(self, playlist_name: str, offset=0, limit=-1) -> List[Playlist]:
        """Searches for playlists by name and returns the results"""
        result = self.playlists.find({
            c.PLAYLIST_NAME: {'$regex': f'{playlist_name}', '$options': '-i'},
            c.PLAYLIST_POLICY: c.PLAYLIST_POLICY_PUBLIC
        }, {c.PLAYLIST_SONGS: 0}).skip(offset)
        if limit >= 0:
            result.limit(limit)
        return [playlist_from_document(res) for res in result]

    def set_policy_private(self, playlist_id):
        self.playlists.update_one(
            {c.PLAYLIST_ID: ObjectId(playlist_id)},
            {'$set': {c.PLAYLIST_POLICY: c.PLAYLIST_POLICY_PRIVATE}}
        )

    def get_creator_playlists(self, creator):
        result = self.playlists.find(
            {f'{c.PLAYLIST_CREATOR}.{c.PLAYLIST_CREATOR_ID}': creator},
            {c.PLAYLIST_SONGS: 0}
        )
        return [playlist_from_document(res) for res in result]

    def get_creator_playlists_id(self, creator):
        result = self.playlists.find(
            {f'{c.PLAYLIST_CREATOR}.{c.PLAYLIST_CREATOR_ID}': creator},
            {c.PLAYLIST_ID: 1}
        )
        return [str(res[c.PLAYLIST_ID]) for res in result]
