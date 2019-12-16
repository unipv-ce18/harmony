from bson import ObjectId

from common.model import Artist
from tests.db_test_utils import DatabaseTest, test_artist_data


class ArtistDatabaseTest(DatabaseTest):

    def test_db_artist_crud(self):
        # Put an artist inside the database and get it back
        artist_in = Artist(test_artist_data[0])
        artist_id = self.db.put_artist(artist_in)
        artist_out = self.db.get_artist(artist_id, include_releases=True)

        # Check if ID matches
        self.assertEqual(artist_id, artist_out.id,
                         'The ID of the returned artist should match the one provided')

        # Check inserted artist has no releases
        self.assertIsNone(artist_out.releases,
                          'The returned artist should still not have any release')

        # Check object equality
        artist_data_in = artist_in.to_dict()
        artist_data_out = artist_out.to_dict()
        artist_data_in['releases'] = None
        artist_data_out['id'] = None
        self.assertDictEqual(artist_data_in, artist_data_out,
                             'Inserted and retrieved artist should match '
                             'except for ID (only in output) and releases (only in input)')

        # Check no longer exists after removal
        self.db.remove_artist(artist_id)
        self.assertIsNone(self.db.get_artist(artist_id),
                          'The artist should no longer exist in the database after removal')

    def test_db_artist_search(self):
        # Put artist in DB
        artist_in = Artist(test_artist_data[0])
        artist_id = self.db.put_artist(artist_in)

        # Check non-matching search query
        search_results = self.db.search_artist('queers')
        self.assertEqual(0, len(search_results),
                         'Non-matching search should not return any result')

        # Check matching search query
        search_results = self.db.search_artist('queens')
        self.assertEqual(1, len(search_results),
                         'Matching search should return one result')

        # Check projection correctness
        artist_search_result = Artist({
            '_id': ObjectId(artist_id),
            'name': artist_in.name,
            'image': artist_in.image,
        })
        self.assertDictEqual(artist_search_result.to_dict(), search_results[0].to_dict(),
                             'Artist search result should match search projection')
