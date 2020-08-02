import logging
import threading

from . import director_config


log = logging.getLogger(__name__)


class Terminator:
    def __init__(self, db_interface, worker_driver, storage_interface):
        self.db = db_interface
        self.worker_driver = worker_driver
        self.st = storage_interface
        self._stop_event = threading.Event()

    def run(self):
        while not self._stop_event.wait(director_config.TERMINATOR_POLLING_CYCLE):
            try:
                log.debug('Terminator has awaken...')

                consumers = self.db.get_consumers_to_remove(director_config.TERMINATOR_IDLE_REMOVAL_CONSUMERS)
                for c in consumers:
                    self.worker_driver.stop_worker(c['driver_handle'])
                    self.db.remove_worker(c['consumer_tag'])

                n_killed = len(consumers)
                if n_killed:
                    log.info('Reaped %s idle workers', n_killed)

                contents = self.db.get_contents_to_remove(director_config.TERMINATOR_IDLE_REMOVAL_CONTENTS)
                for c in contents:
                    bucket = {
                        'image': director_config.STORAGE_BUCKET_IMAGES,
                        'audio': director_config.STORAGE_BUCKET_REFERENCE
                    }.get(c['mimetype'].split('/')[0])

                    self.st.delete_file(bucket, str(c['_id']))
                    self.db.remove_content(str(c['_id']))

                n_killed = len(contents)
                if n_killed:
                    log.info('Removed %s pending contents', n_killed)

            except Exception as e:
                log.error('Closing terminator due to error %s(%s)', type(e).__name__, e)
                break

    def shutdown(self):
        self._stop_event.set()
