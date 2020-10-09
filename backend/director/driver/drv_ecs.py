from datetime import datetime, timezone
import logging

from .worker_driver import WorkerDriver
from .. import director_config
from . import aws


DRIVER_TYPE = 'ecs'
TASK_LAUNCH_TYPE = 'FARGATE'
TASK_HAS_PUBLIC_IP = True  # TODO: Revert to false when VPC is configured properly (to use a NAT)
REQUIRED_PARAMS = ['ECS_ACCESS_KEY', 'ECS_SECRET_KEY', 'ECS_ROLE', 'ECS_CLUSTER_ARN',
                   'ECS_SUBNETS', 'ECS_TASK_DEFINITION', 'ECS_TASK_CONTAINER_NAME']

log = logging.getLogger(__name__)


class EcsWorkerDriver(WorkerDriver):

    _access_credentials = aws.AwsCredentials(director_config.ECS_ACCESS_KEY, director_config.ECS_SECRET_KEY)
    _role_credentials = None

    def __init__(self):
        super().__init__()
        missing_params = list(filter(lambda p: getattr(director_config, p) is None, REQUIRED_PARAMS))
        if len(missing_params) > 0:
            raise RuntimeError(f'ECS Worker Driver is missing configuration parameters: {missing_params}')

        account_id, account_arn = aws.sts_get_caller_identity(self._access_credentials)
        log.info('Using IAM User "%s"', account_arn)

    def start_worker(self, worker_tag):
        task_arn = aws.ecs_run_task(
            credentials=self._get_credentials(),
            cluster_arn=director_config.ECS_CLUSTER_ARN,
            task_definition=director_config.ECS_TASK_DEFINITION,
            launch_type=TASK_LAUNCH_TYPE,
            subnets=director_config.ECS_SUBNETS.split(','),
            public_ip=TASK_HAS_PUBLIC_IP,
            env_override={director_config.ECS_TASK_CONTAINER_NAME: {'HARMONY_WORKER_ID': worker_tag}}
        )
        return {'type': DRIVER_TYPE, 'task_arn': task_arn}

    def stop_worker(self, driver_data):
        handle_type = driver_data['type']
        if handle_type != DRIVER_TYPE:
            raise ValueError(f'Driver handle type must be "{DRIVER_TYPE}", was "{handle_type}"')
        aws.ecs_stop_task(self._get_credentials(), director_config.ECS_CLUSTER_ARN, driver_data['task_arn'],
                          reason='Stopped by director due to inactivity')

    def _get_credentials(self):
        if director_config.ECS_ROLE is None:
            # If no role given, expect that AssumeRole is not necessary
            return self._access_credentials

        if self._role_credentials is None or self._role_credentials.expiration < datetime.now(timezone.utc):
            # Fetch new temporary credentials
            self._role_credentials = aws.sts_assume_role(self._access_credentials, director_config.ECS_ROLE)
            log.info('Got new temporary credentials for role "%s"', director_config.ECS_ROLE)

        return self._role_credentials
