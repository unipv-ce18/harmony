from typing import List, Optional

from bson import ObjectId

from common.model import Release
from .contracts import artist_contract as c
from .codecs import release_to_document, release_from_document
from .pipeline import make_pipeline
from .projections import release_projection, release_projection_search_result


_release_pipeline = make_pipeline(lambda match_params: [
    {'$match': match_params},               # Match against index and operate on a single document
    {'$unwind': f'${c.ARTIST_RELEASES}'},   # Get a document for each release
    {'$match': match_params}                # Extract the right one
], release_projection())


class ReleaseOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.artists = db_connection[c.COLLECTION_NAME]

    def put_release(self, artist_id: str, release: Release) -> str:
        """Insert a release into the database and returns its ID"""
        release_id = ObjectId()
        release_data = release_to_document(release, strip_unsafe=True)

        res = self.artists.update_one(
            {c.ARTIST_ID: ObjectId(artist_id)},
            {'$push': {c.ARTIST_RELEASES: {c.RELEASE_ID: release_id, **release_data}}})
        if res.matched_count != 1:
            raise ValueError('The given artist_id does not exist')
        return str(release_id)

    def put_releases(self, artist_id: str, releases: List[Release]) -> List[str]:
        """Inserts more releases at once"""
        return [self.put_release(artist_id, releases[i]) for i in range(len(releases))]

    def get_release(self, release_id: str, include_songs=False) -> Optional[Release]:
        """Retrieves a release by its ID or None if it does not exist"""
        try:
            return release_from_document(self.artists.aggregate(_release_pipeline(
                {c.INDEX_RELEASE_ID: ObjectId(release_id)},
                projection=release_projection(include_songs=include_songs))
            ).next())
        except StopIteration:
            return None

    def get_release_for_library(self, release_id: str) -> List[Release]:
        """Retrieves a release for the library  by its ID or None if it does not exist"""
        try:
            return release_from_document(self.artists.aggregate(_release_pipeline(
                {c.INDEX_RELEASE_ID: ObjectId(release_id)},
                projection=release_projection_search_result())
            ).next())
        except StopIteration:
            return None

    def get_artist_releases(self, artist_id: str) -> List[Release]:
        """Returns an array of the releases for the given artist"""
        result = self.artists.aggregate(_release_pipeline({c.ARTIST_ID: ObjectId(artist_id)}))
        return [release_from_document(res) for res in result]

    def search_release(self, release_name: str, offset=0, limit=-1) -> List[Release]:
        """Searches for releases by name and returns the results"""
        result = self.artists.aggregate(_release_pipeline(
            {c.INDEX_RELEASE_NAME: {'$regex': f'{release_name}', '$options': '-i'}},
            offset, limit, projection=release_projection_search_result()))
        return [release_from_document(res) for res in result]

    def remove_release(self, release_id: str):
        res = self.artists.update_one(
            {c.INDEX_RELEASE_ID: ObjectId(release_id)},     # To select a single document by index
            {'$pull': {c.ARTIST_RELEASES: {c.RELEASE_ID: ObjectId(release_id)}}})
        if res.matched_count != 1:
            raise ValueError('The given release_id does not exist')

    def update_release_cover(self, release_id, image_link):
        return self.artists.update_one(
            {c.INDEX_RELEASE_ID: ObjectId(release_id)},
            {'$set': {f'{c.ARTIST_RELEASES}.$.{c.RELEASE_COVER}': image_link}}
        ).matched_count
