import logging
import os
import signal
import sys

from common import log_util
from common.database import Database, connect_db
from common.storage import get_storage_interface
from . import worker_config
from .worker import Worker


def _exit_gracefully(signum, frame):
    worker.shutdown()


log_util.configure_logging(__package__, logging.DEBUG)
signal.signal(signal.SIGINT, _exit_gracefully)
signal.signal(signal.SIGTERM, _exit_gracefully)

_log = logging.getLogger('worker')

consumer_tag = os.environ.get('HARMONY_WORKER_ID')
if consumer_tag is None:
    _log.critical('Attempted anonymous worker startup (no consumer tag given)')
    sys.exit(1)

worker = Worker(
    consumer_tag=consumer_tag,
    db_interface=Database(connect_db(worker_config).get_database()),
    storage_interface=get_storage_interface(worker_config))
_log.info('Started worker "%s"', consumer_tag)
worker.run()
