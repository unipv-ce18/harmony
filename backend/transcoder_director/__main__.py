import logging

import pymongo

from common import log_util
from common.database import Database
from .config import director_config
from .orchestrator import Orchestrator
from .driver import create_driver_from_env


log_util.configure_logging(__package__, logging.DEBUG)

db_client = pymongo.MongoClient(director_config.MONGO_URI,
                                username=director_config.MONGO_USERNAME,
                                password=director_config.MONGO_PASSWORD)

orchestrator = Orchestrator(
    db_interface=Database(db_client.get_database()),
    worker_driver=create_driver_from_env(director_config))
orchestrator.run()
