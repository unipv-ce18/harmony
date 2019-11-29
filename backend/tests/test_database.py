import logging
import unittest
from os import path

import pymongo

from database.database import Database
from utils import read_json
from config import current_config

_test_resources_dir = path.join(path.dirname(path.realpath(__file__)), 'resources')


def _connect_db():
    return Database(pymongo.MongoClient(
        current_config.MONGO_URI,
        username=current_config.MONGO_USERNAME,
        password=current_config.MONGO_PASSWORD
    )[current_config.MONGO_DBNAME])


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
        db.add_artists(read_json(path.join(_test_resources_dir, 'test_artists.json')))
        db.add_users(read_json(path.join(_test_resources_dir, 'test_users.json')))

    @classmethod
    def tearDownClass(cls):
        db = _connect_db()
        # Do not drop to keep preconfigured indexes (but being slower)
        db.artists.delete_many({})
        db.users.delete_many({})

    def setUp(self):
        self.db = _connect_db()

    def tearDown(self):
        pass

    def test_db_search(self):
        result = self.db.search('avon')
        self.assertEqual(0, len(result['artists']))
        self.assertEqual(0, len(result['releases']))
        self.assertEqual(1, len(result['songs']))
