from dateutil.parser import isoparse
from xml.etree import ElementTree
import json

from .credentials import AwsCredentials

STS_API_VERSION = '2011-06-15'
ECS_API_VERSION = '2014-11-13'


def parse_caller_identity_response(data):
    """Returns account ID and ARN for a GetCallerIdentityResponse"""
    root = ElementTree.fromstring(data)
    if root.tag != '{https://sts.amazonaws.com/doc/' + STS_API_VERSION + '/}GetCallerIdentityResponse':
        raise ValueError(f'Not a GetCallerIdentity response ver. {STS_API_VERSION}')

    return root.find('./{*}GetCallerIdentityResult/{*}Account').text, \
           root.find('./{*}GetCallerIdentityResult/{*}Arn').text


def parse_assume_role_response(data):
    """Returns AWS credentials from a AssumeRoleResponse"""
    root = ElementTree.fromstring(data)
    if root.tag != '{https://sts.amazonaws.com/doc/' + STS_API_VERSION + '/}AssumeRoleResponse':
        raise ValueError(f'Not a AssumeRoleResponse response ver. {STS_API_VERSION}')

    cred = root.find('./{*}AssumeRoleResult/{*}Credentials')
    return AwsCredentials(
        cred.find('./{*}AccessKeyId').text,
        cred.find('./{*}SecretAccessKey').text,
        cred.find('./{*}SessionToken').text,
        isoparse(cred.find('./{*}Expiration').text))


def parse_run_task_response(data):
    """Returns the task ARN from a RunTask action response"""
    return json.loads(data)['tasks'][0]['taskArn']


def parse_stop_task_response(data):
    """Returns the task ARN from a StopTask action response"""
    return json.loads(data)['task']['taskArn']
