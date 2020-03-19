import os
import subprocess

from .worker_driver import WorkerDriver


DRIVER_TYPE = 'process'
PROCESS_COMMANDLINE = ['python', '-m', 'transcoder_worker']


class ProcessWorkerDriver(WorkerDriver):

    def start_worker(self, worker_tag):
        # Start the process
        p = subprocess.Popen(PROCESS_COMMANDLINE, env={
            **os.environ,
            'HARMONY_WORKER_ID': worker_tag
        })

        # Store in DB
        self.db.put_worker(worker_tag, {'type': DRIVER_TYPE, 'pid': p.pid})
