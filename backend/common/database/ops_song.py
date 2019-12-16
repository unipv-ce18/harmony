from typing import Any, List, Optional

from bson import ObjectId

from common.model import Song
from .pipeline import make_pipeline
from .projections import song_projection, song_projection_search_result


_song_pipeline = make_pipeline(lambda match_params: [
    {'$match': match_params},           # Match against index
    {'$unwind': '$releases'},           # Get a document for each release
    {'$match': match_params},           # Match again on the release containing our song
    {'$unwind': '$releases.songs'},     # Get a document for each song
    {'$match': match_params}            # Match again for the right song
], song_projection())


class SongOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.artists = db_connection['artists']

    def put_song(self, release_id: str, song: Song) -> str:
        """Inserts a song into the database and returns its ID"""
        song_id = ObjectId()
        song_data = song.to_dict()
        del song_data['id']
        del song_data['artist']
        del song_data['release']
        del song_data['repr_data']

        res = self.artists.update_one(
            {'releases._id': ObjectId(release_id)},
            {'$push': {'releases.$.songs': {'_id': song_id, **song_data}}})
        if res.matched_count != 1:
            raise ValueError('The given release_id does not exist')
        return str(song_id)

    def put_songs(self, release_id: str, songs: List[Song]) -> List[str]:
        """Inserts more songs at once"""
        return [self.put_song(release_id, songs[i]) for i in range(len(songs))]

    def get_song(self, song_id: str) -> Optional[Song]:
        """Retrieves a song by its ID or None if it does not exist"""
        try:
            return Song(self.artists.aggregate(
                _song_pipeline({'releases.songs._id': ObjectId(song_id)})
            ).next())
        except StopIteration:
            return None

    def get_release_songs(self, release_id: str) -> List[Song]:
        """Returns an array of the songs inside the given release"""
        result = self.artists.aggregate(_song_pipeline({'releases._id': ObjectId(release_id)}))
        return [Song(res) for res in result]

    def search_song(self, song_name: str, offset=0, limit=-1):
        """Searches for songs by name and returns the results"""
        result = self.artists.aggregate(_song_pipeline(
            {'releases.songs.title': {'$regex': f'{song_name}', '$options': '-i'}},
            offset, limit, projection=song_projection_search_result()))
        return [Song(res) for res in result]

    def remove_song(self, song_id: str):
        res = self.artists.update_one(
            {'releases.songs._id': ObjectId(song_id)},      # To select a single document by index
            {'$pull': {'releases.$.songs': {'_id': ObjectId(song_id)}}},
            upsert=False)
        if res.matched_count != 1:
            raise ValueError('The given song_id does not exist')

    def put_song_representation_data(self, song_id: str, data: Any):
        res = self.artists.update_one(
            {'releases.songs._id': ObjectId(song_id)},
            {'$set': {'releases.$.songs.$[s].repr_data': data}},
            array_filters=[{'s._id': ObjectId(song_id)}])
        if res.matched_count != 1:
            raise ValueError('The given song_id does not exist')

    def get_song_representation_data(self, song_id: str) -> Optional[Any]:
        try:
            ret = self.artists.aggregate([
                *_song_pipeline({'releases.songs._id': ObjectId(song_id)}, projection=None),
                {'$replaceRoot': {'newRoot': {'$ifNull': ['$releases.songs.repr_data', {}]}}}
            ]).next()
            return ret if ret else None     # Emptiness check
        except StopIteration:
            return None
