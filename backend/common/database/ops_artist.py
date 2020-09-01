from typing import List, Optional

from bson import ObjectId

from common.model import Artist
from .contracts import artist_contract as c
from .codecs import artist_from_document, artist_to_document
from .projections import artist_projection, artist_projection_search_result
from .search_util import make_query_regex


class ArtistOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.artists = db_connection[c.COLLECTION_NAME]

    def put_artist(self, artist: Artist) -> str:
        """Inserts an artist into the database and returns its new ID

        Releases are stripped from the artist and must be inserted separately through `put_release`.
        """
        artist_data = artist_to_document(artist, strip_unsafe=True)
        return str(self.artists.insert_one(artist_data).inserted_id)

    def put_artists(self, artists: List[Artist]) -> List[str]:
        """Inserts more artists at once"""
        return [self.put_artist(artists[i]) for i in range(len(artists))]

    def get_artist(self, artist_id: str, include_releases=False) -> Optional[Artist]:
        """Retrieves an artist by its ID or None if it does not exist"""
        artist_doc = self.artists.find_one(
            {c.ARTIST_ID: ObjectId(artist_id)},
            artist_projection(include_releases))
        return artist_from_document(artist_doc) if artist_doc is not None else None

    def get_artist_for_library(self, artist_id: str) -> Optional[Artist]:
        """Retrieves an artist for the library by its ID or None if it does not exist"""
        artist_doc = self.artists.find_one(
            {c.ARTIST_ID: ObjectId(artist_id)},
            artist_projection_search_result())
        return artist_from_document(artist_doc) if artist_doc is not None else None

    def search_artist(self, artist_name: str, offset=0, limit=-1, genres=None) -> List[Artist]:
        """Searches for artists by name and returns the results"""
        query = {c.ARTIST_NAME: {'$regex': make_query_regex(artist_name), '$options': '-i'}}
        if genres is not None:
            g = {c.ARTIST_GENRES: {'$regex': make_query_regex(genres), '$options': '-i'}}
            query = {**query, **g}
        result = self.artists.find(query, artist_projection_search_result()).skip(offset)
        if limit >= 0:
            result.limit(limit)
        return [artist_from_document(res) for res in result]

    def remove_artist(self, artist_id: str):
        query = {c.ARTIST_ID: ObjectId(artist_id)}
        self.artists.remove(query)

    def update_artist_image(self, artist_id, image_link):
        return self.artists.update_one(
            {c.ARTIST_ID: ObjectId(artist_id)},
            {'$set': {c.ARTIST_IMAGE: image_link}}
        ).matched_count

    def update_artist(self, artist_id, patch):
        return self.artists.update_one(
            {c.ARTIST_ID: ObjectId(artist_id)},
            {'$set': patch}
        ).matched_count

    def update_artist_counter(self, artist_id, count):
        return self.artists.update_one(
            {c.ARTIST_ID: ObjectId(artist_id)},
            {'$inc': {c.ARTIST_COUNTER: count}}
        ).matched_count

    def get_user_artists(self, user_id):
        result = self.artists.find(
            {c.ARTIST_CREATOR: ObjectId(user_id)},
            artist_projection())
        return [artist_from_document(res) for res in result]
