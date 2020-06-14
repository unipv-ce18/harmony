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
        return playlist_from_document(playlist_doc[c.PLAYLIST_CREATOR]) if playlist_doc else None

    def get_playlist_for_library(self, playlist_id):
        playlist_doc = self.playlists.find_one({c.PLAYLIST_ID: ObjectId(playlist_id)})
        return playlist_from_document(playlist_doc) if playlist_doc is not None else None
