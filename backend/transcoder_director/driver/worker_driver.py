class WorkerDriver:
    """Implementations of this class are used by ``Orchestrator`` to spawn and manage workers of different types"""

    def __init__(self):
        self.db = None

    def set_db(self, db):
        self.db = db

    def start_worker(self, worker_tag):
        raise NotImplementedError('Not a valid worker driver instance')
