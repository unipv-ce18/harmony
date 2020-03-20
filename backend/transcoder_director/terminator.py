import logging
import threading

from .config import director_config


log = logging.getLogger(__name__)


class Terminator:
    def __init__(self, db_interface, worker_driver):
        self.db = db_interface
        self.worker_driver = worker_driver
        self._stop_event = threading.Event()

    def run(self):
        while not self._stop_event.wait(director_config.TERMINATOR_POLLING_CYCLE):
            try:
                log.debug('Terminator has awaken...')

                consumers = self.db.get_consumers_to_remove(director_config.TERMINATOR_IDLE_REMOVAL)
                for c in consumers:
                    self.worker_driver.stop_worker(c['driver_handle'])
                    self.db.remove_worker(c['consumer_tag'])

                n_killed = len(consumers)
                if n_killed:
                    log.info('Reaped %s idle workers', n_killed)

            except Exception as e:
                log.error('Closing terminator due to error %s(%s)', type(e).__name__, e)
                break

    def shutdown(self):
        self._stop_event.set()
