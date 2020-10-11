import sys

import boto3
from botocore.exceptions import ClientError

from . import _util_print, _util_handle_error
from ..cli import bcolors, color_print
from ..config import get_accounts


class ECR:

    def __init__(self, account, region):
        credentials = get_accounts()[0][account].credentials
        self.client = boto3.client('ecr', **{**credentials.__dict__, 'region_name': region})
        color_print(bcolors.HEADER, f'\nConfiguring ECR for account "{account}"')

    def create_repository(self, repository_name):
        try:
            response = self.client.create_repository(repositoryName=repository_name)
            repository = response['repository']
            _util_print(f"Repository \"{repository['repositoryName']}\"",
                        f"created at \"{repository['repositoryUri']}\"")
            return repository['repositoryArn']
        except ClientError as e:
            _util_handle_error(e)

    def delete_repository(self, repository_name):
        try:
            response = self.client.delete_repository(repositoryName=repository_name)
            repository = response['repository']
            _util_print(f"Repository \"{repository['repositoryName']}\"", 'deleted')
        except ClientError as e:
            _util_handle_error(e)

    def put_lifecycle_policy(self, repository_name, policy_text):
        try:
            response = self.client.put_lifecycle_policy(repositoryName=repository_name, lifecyclePolicyText=policy_text)
            _util_print(f"Repository \"{response['repositoryName']}\"", 'applied lifecycle policy')
        except ClientError as e:
            _util_handle_error(e)

    def set_repository_policy(self, repository_name, policy_text):
        try:
            response = self.client.set_repository_policy(repositoryName=repository_name, policyText=policy_text)
            _util_print(f"Repository \"{response['repositoryName']}\"", 'applied access policy')
        except ClientError as e:
            _util_handle_error(e)
