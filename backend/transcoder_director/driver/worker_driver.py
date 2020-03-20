class WorkerDriver:
    """Implementations of this class are used by ``Orchestrator`` to spawn and manage workers of different types"""

    def __init__(self):
        self.db = None

    def set_db(self, db):
        self.db = db

    def start_worker(self, worker_tag):
        """Starts a new transcoder worker

        :param worker_tag: The worker tag to pass to the worker instance
        :return: Handle used by the driver to identify the worker
        """
        raise NotImplementedError('Not a valid worker driver instance')

    def stop_worker(self, driver_data):
        """Stops a transcoder worker

        :param driver_data: The object returned from ``start_worker()``
        """
        raise NotImplementedError('Not a valid worker driver instance')
