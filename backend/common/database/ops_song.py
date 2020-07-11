from typing import Any, List, Optional

from bson import ObjectId

from common.model import Song
from .contracts import artist_contract as c
from .codecs import song_from_document, song_to_document
from .pipeline import make_pipeline
from .projections import song_projection, song_projection_search_result
from .search_util import make_query_regex


_song_pipeline = make_pipeline(lambda match_params: [
    {'$match': match_params},                                   # Match against index
    {'$unwind': f'${c.ARTIST_RELEASES}'},                       # Get a document for each release
    {'$match': match_params},                                   # Match again on the release containing our song
    {'$unwind': f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}'},     # Get a document for each song
    {'$match': match_params}                                    # Match again for the right song
], song_projection())


class SongOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.artists = db_connection[c.COLLECTION_NAME]

    def put_song(self, release_id: str, song: Song, strip_unsafe=True) -> str:
        """Inserts a song into the database and returns its ID"""
        song_data = song_to_document(song, strip_unsafe)
        if strip_unsafe:
            song_id = ObjectId()
            song_data = {c.SONG_ID: song_id, **song_data}

        res = self.artists.update_one(
            {c.INDEX_RELEASE_ID: ObjectId(release_id)},
            {'$push': {f'{c.ARTIST_RELEASES}.$.{c.RELEASE_SONGS}': song_data}})
        if res.matched_count != 1:
            raise ValueError('The given release_id does not exist')
        return str(song_data[c.SONG_ID])

    def put_songs(self, release_id: str, songs: List[Song]) -> List[str]:
        """Inserts more songs at once"""
        return [self.put_song(release_id, songs[i]) for i in range(len(songs))]

    def get_song(self, song_id: str) -> Optional[Song]:
        """Retrieves a song by its ID or None if it does not exist"""
        try:
            return song_from_document(self.artists.aggregate(
                _song_pipeline({c.INDEX_SONG_ID: ObjectId(song_id)})
            ).next())
        except StopIteration:
            return None

    def get_song_for_library(self, song_id: str) -> Optional[Song]:
        """Retrieves a song for the library by its ID or None if it does not exist"""
        try:
            return song_from_document(self.artists.aggregate(_song_pipeline(
                {c.INDEX_SONG_ID: ObjectId(song_id)},
                projection=song_projection_search_result())
            ).next())
        except StopIteration:
            return None

    def get_release_songs(self, release_id: str) -> List[Song]:
        """Returns an array of the songs inside the given release"""
        result = self.artists.aggregate(_song_pipeline({c.INDEX_RELEASE_ID: ObjectId(release_id)}))
        return [song_from_document(res) for res in result]

    def search_song(self, song_name: str, offset=0, limit=-1):
        """Searches for songs by name and returns the results"""
        result = self.artists.aggregate(_song_pipeline(
            {c.INDEX_SONG_TITLE: {'$regex': make_query_regex(song_name), '$options': '-i'}},
            offset, limit, projection=song_projection_search_result()))
        return [song_from_document(res) for res in result]

    def remove_song(self, song_id: str):
        res = self.artists.update_one(
            {c.INDEX_SONG_ID: ObjectId(song_id)},   # To select a single document by index
            {'$pull': {f'{c.ARTIST_RELEASES}.$.{c.RELEASE_SONGS}': {c.SONG_ID: ObjectId(song_id)}}},
            upsert=False)
        if res.matched_count != 1:
            raise ValueError('The given song_id does not exist')

    def put_song_representation_data(self, song_id: str, data: Any):
        res = self.artists.update_one(
            {c.INDEX_SONG_ID: ObjectId(song_id)},
            {'$set': {f'{c.ARTIST_RELEASES}.$.{c.RELEASE_SONGS}.$[s].{c.SONG_REPRESENTATION_DATA}': data}},
            array_filters=[{f's.{c.SONG_ID}': ObjectId(song_id)}])
        if res.matched_count != 1:
            raise ValueError('The given song_id does not exist')

    def get_song_representation_data(self, song_id: str) -> Optional[Any]:
        try:
            new_root = f'${c.ARTIST_RELEASES}.{c.RELEASE_SONGS}.{c.SONG_REPRESENTATION_DATA}'
            ret = self.artists.aggregate([
                *_song_pipeline({c.INDEX_SONG_ID: ObjectId(song_id)}, projection=None),
                {'$replaceRoot': {'newRoot': {'$ifNull': [new_root, {}]}}}
            ]).next()
            return ret if ret else None     # Emptiness check
        except StopIteration:
            raise ValueError('The given song_id does not exist')

    def update_song(self, song_id, patch):
        patch = dict((f'{c.ARTIST_RELEASES}.$.{c.RELEASE_SONGS}.$[s].{k}', v) for k, v in patch.items())
        res = self.artists.update_one(
            {c.INDEX_SONG_ID: ObjectId(song_id)},
            {'$set': patch},
            array_filters=[{f's.{c.SONG_ID}': ObjectId(song_id)}])
        return res.matched_count == 1
