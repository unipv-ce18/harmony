import os
import signal
import subprocess

from .worker_driver import WorkerDriver


DRIVER_TYPE = 'process'
PROCESS_COMMANDLINE = ['python', '-m', 'transcoder_worker']


class ProcessWorkerDriver(WorkerDriver):

    def start_worker(self, worker_tag):
        p = subprocess.Popen(PROCESS_COMMANDLINE, env={
            **os.environ,
            'HARMONY_WORKER_ID': worker_tag
        })
        return {'type': DRIVER_TYPE, 'pid': p.pid}

    def stop_worker(self, driver_data):
        handle_type = driver_data['type']
        if handle_type != DRIVER_TYPE:
            raise ValueError(f'Driver handle type must be "{DRIVER_TYPE}", was "{handle_type}"')
        os.kill(driver_data['pid'], signal.SIGTERM)
