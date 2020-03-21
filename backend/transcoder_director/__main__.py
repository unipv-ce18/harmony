import logging
import signal
import threading

from common import log_util
from common.database import Database, connect_db
from . import director_config
from .driver import create_driver_from_env
from .orchestrator import Orchestrator
from .terminator import Terminator


def _exit_gracefully(signum, frame):
    orchestrator.shutdown()


log_util.configure_logging(__package__, logging.DEBUG)
signal.signal(signal.SIGINT, _exit_gracefully)
signal.signal(signal.SIGTERM, _exit_gracefully)

db_interface = Database(connect_db(director_config).get_database())  # Docs say PyMongo is thread-safe
worker_driver = create_driver_from_env(director_config)

orchestrator = Orchestrator(db_interface, worker_driver)
terminator = Terminator(db_interface, worker_driver)

# Run terminator (worker garbage collection) on a separate thread
thread_gc = threading.Thread(name='worker_gc', target=terminator.run)

thread_gc.start()
orchestrator.run()

# When orchestrator stops in the main thread, wait for terminator to end too
terminator.shutdown()
thread_gc.join()
