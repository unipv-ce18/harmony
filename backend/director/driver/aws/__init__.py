import ssl
import json
from urllib.request import urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError

import certifi

from .credentials import AwsCredentials
from .signer_v4 import make_signed_request
from . import spec

# If python refuses to load ca-certificates on windows:
#   import ssl
#   ssl._create_default_https_context = ssl._create_unverified_context

_ssl_ctx = ssl.create_default_context(cafile=certifi.where())

REQUEST_TIMEOUT_SEC = 15
ASSUME_ROLE_SESSION_NAME = 'hy-director'

STS_ENDPOINT = 'https://sts.amazonaws.com/'
ECS_ENDPOINT = 'https://ecs.us-east-1.amazonaws.com/'
ECS_TARGET_PREFIX = 'AmazonEC2ContainerServiceV20141113'


def _call_api(creds, endpoint, params, json_amz_tgt=None):
    payload = json.dumps(params) if json_amz_tgt is not None else urlencode(params)
    req = make_signed_request(creds, 'POST', endpoint, payload.encode('utf-8'), json_amz_tgt)

    try:
        return urlopen(req, timeout=REQUEST_TIMEOUT_SEC, context=_ssl_ctx).read().decode()
    except HTTPError as e:
        raise RuntimeError(f'AWS API Error: {e.read().decode()}')


def _call_api_sts(credentials, action, params=None):
    sts_params = {'Action': action, 'Version': spec.STS_API_VERSION, **(params or {})}
    return _call_api(credentials, STS_ENDPOINT, sts_params)


def _call_api_ecs(credentials, action, params=None):
    ecs_params = {'Action': action, 'Version': spec.ECS_API_VERSION, **(params or {})}
    return _call_api(credentials, ECS_ENDPOINT, ecs_params,
                     json_amz_tgt=f'{ECS_TARGET_PREFIX}.{action}')


def sts_get_caller_identity(credentials: AwsCredentials):
    """Returns account ID and ARN for the user matching the given AWS credentials"""
    data = _call_api_sts(credentials, 'GetCallerIdentity')
    return spec.parse_caller_identity_response(data)


def sts_assume_role(credentials: AwsCredentials, role_arn: str):
    """Assumes the role given by ARN and returns the credentials used to impersonate it"""
    params = {'RoleArn': role_arn, 'RoleSessionName': ASSUME_ROLE_SESSION_NAME}
    data = _call_api_sts(credentials, 'AssumeRole', params)
    return spec.parse_assume_role_response(data)


def ecs_list_clusters(credentials: AwsCredentials):
    return _call_api_ecs(credentials, 'ListClusters')


def ecs_run_task(credentials: AwsCredentials, cluster_arn, task_definition, launch_type, subnets,
                 public_ip=False, env_override=None):
    params = {'Action': 'RunTask',
              'Version': spec.ECS_API_VERSION,
              'cluster': cluster_arn,
              'launchType': launch_type,
              'taskDefinition': task_definition,
              'networkConfiguration': {'awsvpcConfiguration': {
                  'assignPublicIp': 'ENABLED' if public_ip else 'DISABLED',
                  'subnets': subnets
              }}}
    if env_override is not None:
        params['overrides'] = {"containerOverrides": [{
            "name": container,
            "environment": [{"name": k, "value": v} for k, v in environment.items()]
        } for container, environment in env_override.items()]}
    data = _call_api_ecs(credentials, 'RunTask', params)
    return spec.parse_run_task_response(data)


def ecs_stop_task(credentials, cluster_arn, task_arn, reason=None):
    params = {'Action': 'StopTask',
              'Version': spec.ECS_API_VERSION,
              'cluster': cluster_arn,
              'task': task_arn}
    if reason is not None:
        params['reason'] = reason
    data = _call_api_ecs(credentials, 'StopTask', params)
    return spec.parse_stop_task_response(data)
