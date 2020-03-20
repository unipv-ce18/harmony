import logging

import pymongo

from common import log_util
from common.database import Database
from .config import terminator_config
from .terminator import Terminator
from transcoder_director.driver import create_driver_from_env


log_util.configure_logging(__package__, logging.DEBUG)

db_client = pymongo.MongoClient(terminator_config.MONGO_URI,
                                username=terminator_config.MONGO_USERNAME,
                                password=terminator_config.MONGO_PASSWORD)

terminator = Terminator(
    db_interface=Database(db_client.get_database()),
    worker_driver=create_driver_from_env(terminator_config))
terminator.run()
