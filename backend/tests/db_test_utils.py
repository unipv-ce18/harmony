import logging
import unittest
from os import path

import pymongo

from common.database import Database
from config import current_config
from utils import read_json


def _connect_db():
    return Database(pymongo.MongoClient(
        current_config.MONGO_URI,
        username=current_config.MONGO_USERNAME,
        password=current_config.MONGO_PASSWORD
    ).get_database())


_test_resources_dir = path.join(path.dirname(path.realpath(__file__)), 'resources')

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
