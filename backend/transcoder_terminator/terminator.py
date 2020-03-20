import logging
from time import sleep

from common.database import Database
from .config import terminator_config


log = logging.getLogger(__name__)


class Terminator:
    def __init__(self, db_interface, worker_driver):
        self.db = db_interface
        self.worker_driver = worker_driver

    def run(self):
        while True:
            try:
                log.debug('Starting terminator work')

                consumers = self.db.get_consumers_to_remove()
                for c in consumers:
                    # self.worker_driver.kill(c['driver_data']['pid'])
                    self.db.remove_worker(c['consumer_tag'])

                log.debug('Killed %s workers', len(consumers))
                sleep(terminator_config.POLLING_CYCLE)
            except KeyboardInterrupt:
                log.info('Closing terminator')
                break
            except Exception as e:
                log.error('Closing terminator due to error %s(%s)', type(e).__name__, e)
                break
