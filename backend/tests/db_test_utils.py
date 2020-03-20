import json
import logging
import unittest
from os import path

from common.database import Database, connect_db
from apiserver.config import current_config


def _connect_db():
    return Database(connect_db(current_config).get_database())


_test_resources_dir = path.join(path.dirname(path.realpath(__file__)), 'resources')


def read_json(file_path):
    with open(file_path, 'r') as f:
        data = f.read()
    json_data = json.loads(data, strict=False)
    if isinstance(json_data, dict):
        return [json_data]
    return json_data


test_artist_data = read_json(path.join(_test_resources_dir, 'test_artists.json'))


def make_artist_ref(artist_id, artist):
    return {'id': artist_id, 'name': artist.name}


def make_release_ref(release_id, release):
    return {
        'id': release_id,
        'name': release.name,
        'date': release.date,
        'type': release.type,
        'cover': release.cover
    }


class DatabaseTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db = _connect_db()
        if db.artists.count_documents({}) > 0:
            logging.warning('Artists collection is not empty and will be dropped')
            db.artists.delete_many({})
        if db.users.count_documents({}) > 0:
            logging.warning('Users collection is not empty and will be dropped')
            db.users.delete_many({})

    @classmethod
    def tearDownClass(cls):
        pass

    def setUp(self):
        self.db = _connect_db()

    def tearDown(self):
        # Do not drop to keep preconfigured indexes (but being slower)
        self.db.artists.delete_many({})
        self.db.users.delete_many({})
