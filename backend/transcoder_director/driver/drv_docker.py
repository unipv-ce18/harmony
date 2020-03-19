from .worker_driver import WorkerDriver


DRIVER_TYPE = 'docker'


class DockerWorkerDriver(WorkerDriver):

    def start_worker(self, worker_tag):
        raise RuntimeError('Me, stupid')
