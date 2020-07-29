from dataclasses import asdict

from common.database.codecs import artist_from_document, release_from_document
from tests.db_test_utils import DatabaseTest, test_artist_data, make_artist_ref


class ReleaseDatabaseTest(DatabaseTest):

    def setUp(self):
        super().setUp()

        # Insert releases in the database
        self.artist_in = artist_from_document(test_artist_data[0])
        self.artist_id = self.db.put_artist(self.artist_in)

        self.release_ids = self.db.put_releases(self.artist_id, self.artist_in.releases)

    def test_db_release(self):
        # Check inserted equals source array
        self.assertEqual(len(self.artist_in.releases), len(self.release_ids),
                         'Inserted releases length should match returned IDs array length')

        artist_ref = make_artist_ref(self.artist_id, self.artist_in)

        for i in range(len(self.release_ids)):
            rel_in_data = asdict(self.artist_in.releases[i])
            rel_out_data = asdict(self.db.get_release(self.release_ids[i]))

            # Check references match
            self.assertIsNone(rel_in_data['artist'],
                              'Inserted release should not have any artist reference')
            self.assertDictEqual(artist_ref, rel_out_data['artist'],
                                 'Extracted release should have a correct artist reference')

            # Check object equality
            rel_in_data['songs'] = None
            rel_out_data['id'] = None
            rel_out_data['artist'] = None
            rel_out_data['counter'] = None  # defaults to 0
            self.assertDictEqual(rel_in_data, rel_out_data,
                                 'Extracted release content should match inserted')

    def test_db_release_search(self):
        # Test search
        search_result = self.db.search_release('paralyze')
        self.assertEqual(1, len(search_result),
                         'Search result should only have one item for the given query')

        expected_result = release_from_document({
            '_id': self.release_ids[3],
            'name': self.artist_in.releases[3].name,
            'artist': make_artist_ref(self.artist_id, self.artist_in),
            'cover': self.artist_in.releases[3].cover
        })
        self.assertDictEqual(asdict(expected_result), asdict(search_result[0]),
                             'Release search result should match search projection')
