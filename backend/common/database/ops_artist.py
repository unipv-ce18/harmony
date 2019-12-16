from typing import List, Optional

from bson import ObjectId

from common.model import Artist
from .projections import artist_projection, artist_projection_search_result


class ArtistOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.artists = db_connection['artists']

    def put_artist(self, artist: Artist) -> str:
        """Inserts an artist into the database and returns its new ID

        Releases are stripped from the artist and must be inserted separately through `put_release`.
        """
        artist_data = artist.to_dict()
        del artist_data['id']
        del artist_data['releases']
        return str(self.artists.insert_one(artist_data).inserted_id)

    def put_artists(self, artists: List[Artist]) -> List[str]:
        """Inserts more artists at once"""
        return [self.put_artist(artists[i]) for i in range(len(artists))]

    def get_artist(self, artist_id: str, include_releases=False) -> Optional[Artist]:
        """Retrieves an artist by its ID or None if it does not exist"""
        artist_doc = self.artists.find_one(
            {'_id': ObjectId(artist_id)},
            artist_projection(include_releases))
        return Artist(artist_doc) if artist_doc is not None else None

    def search_artist(self, artist_name: str, offset=0, limit=-1) -> List[Artist]:
        """Searches for artists by name and returns the results"""
        result = self.artists.find(
            {'name': {'$regex': f'{artist_name}', '$options': '-i'}},
            artist_projection_search_result()
        ).skip(offset)
        if limit >= 0:
            result.limit(limit)
        return [Artist(res) for res in result]

    def remove_artist(self, artist_id: str):
        query = {'_id': ObjectId(artist_id)}
        self.artists.remove(query)
