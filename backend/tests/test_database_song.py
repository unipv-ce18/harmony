from dataclasses import asdict
from random import randrange

from common.database.codecs import artist_from_document, song_from_document
from tests.db_test_utils import DatabaseTest, test_artist_data, make_artist_ref, make_release_ref


class SongDatabaseTest(DatabaseTest):

    def setUp(self):
        super().setUp()

        # Insert songs in the database
        self.artist_in = artist_from_document(test_artist_data[0])
        self.artist_id = self.db.put_artist(self.artist_in)

        self.release_ids = []
        self.song_ids = []

        for rel in self.artist_in.releases:
            rel_id = self.db.put_release(self.artist_id, rel)
            my_song_ids = self.db.put_songs(rel_id, rel.songs)

            self.release_ids.append(rel_id)
            self.song_ids.append(my_song_ids)

    def test_db_song_crud(self):
        artist_ref = make_artist_ref(self.artist_id, self.artist_in)

        for i in range(len(self.song_ids)):
            rel_in = self.artist_in.releases[i]
            release_ref = make_release_ref(self.release_ids[i], rel_in)

            # Check inserted equals source array
            self.assertEqual(len(rel_in.songs), len(self.song_ids[i]),
                             'Inserted songs length should match returned IDs array length')

            for j in range(len(self.song_ids[i])):
                song_in_data = asdict(rel_in.songs[j])
                song_out_data = asdict(self.db.get_song(self.song_ids[i][j]))

                # Check references match
                self.assertIsNone(song_in_data['artist'],
                                  'Inserted song should not have artist reference')
                self.assertIsNone(song_in_data['release'],
                                  'Inserted song should not have release reference')
                self.assertDictEqual(artist_ref, song_out_data['artist'],
                                     'Extracted song should have a correct artist reference')
                self.assertDictEqual(release_ref, song_out_data['release'],
                                     'Extracted song should have a correct release reference')

                # Check object equality
                song_out_data['id'] = None
                song_out_data['artist'] = None
                song_out_data['release'] = None
                song_out_data['counter'] = None  # defaults to 0
                self.assertDictEqual(song_in_data, song_out_data,
                                     'Extracted release content should match inserted')

    def test_db_release_songs(self):
        for i in range(len(self.release_ids)):
            # Get release with songs
            rich_release_out = self.db.get_release(self.release_ids[i], include_songs=True)

            # Check name equals
            release_in = self.artist_in.releases[i]
            self.assertEqual(release_in.name, rich_release_out.name,
                             'Extracted release name should match inserted')

            # For each song, check if it matches inserted
            for j in range(len(release_in.songs)):
                song_in = asdict(release_in.songs[j])
                song_out = asdict(rich_release_out.songs[j])
                song_out['id'] = None
                song_out['counter'] = None  # defaults to 0
                self.assertDictEqual(song_in, song_out)

    def test_db_song_search(self):
        # Test search
        search_result = self.db.search_song('margidda')
        self.assertEqual(0, len(search_result),
                         'Should have no search results for non-matching query')

        search_result = self.db.search_song('keeping a secret')
        self.assertEqual(1, len(search_result),
                         'Search result should have only two items for the given query')

        expected_result = song_from_document({
            '_id': self.song_ids[1][1],
            'title': self.artist_in.releases[1].songs[1].title,
            'length': self.artist_in.releases[1].songs[1].length,
            'artist': make_artist_ref(self.artist_id, self.artist_in),
            'release': make_release_ref(self.release_ids[1], self.artist_in.releases[1])
        })
        self.assertDictEqual(asdict(expected_result), asdict(search_result[0]),
                             'Release search result should match search projection')

    def test_db_song_repr_data(self):
        # Peek a random song
        ri = randrange(0, len(self.song_ids))
        si = randrange(0, len(self.song_ids[ri]))

        # Dump some random data to it
        repr_data = {
            'today': 'jesus'' birthday',
            'tomorrow': 'electric chair',
            'then': 'cat-on-my-lap hour'
        }
        self.db.put_song_representation_data(self.song_ids[ri][si], repr_data)

        for i in range(len(self.song_ids)):
            for j in range(len(self.song_ids[i])):
                song_id = self.song_ids[i][j]

                ex_repr_data = self.db.get_song_representation_data(song_id)

                if i == ri and j == si:
                    # Extracted data should be the same...
                    self.assertDictEqual(repr_data, ex_repr_data,
                                         'Extracted representation data should match inserted')
                else:
                    # ...and none for all the other songs
                    self.assertIsNone(ex_repr_data,
                                      'Unaltered song should have None representation data')

                # Ensure Song object matches
                self.assertEqual(ex_repr_data, self.db.get_song(song_id).repr_data,
                                 'Representation data from Song object should match get_representation_data')
