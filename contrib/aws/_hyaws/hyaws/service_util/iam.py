import boto3
from botocore.exceptions import ClientError

from . import _util_print, _util_handle_error
from ..cli import bcolors, color_print
from ..config import get_accounts


IAM_PATH = '/harmony/'


class IAM:

    def __init__(self, account):
        credentials = get_accounts()[0][account].credentials
        self.client = boto3.client('iam', **credentials.__dict__)
        color_print(bcolors.HEADER, f'\nConfiguring IAM for account "{account}"')

    def create_user(self, user_name):
        try:
            response = self.client.create_user(UserName=user_name, Path=IAM_PATH)
            user = response['User']
            _util_print(f"User \"{user['UserName']}\"", f"created with id \"{user['UserId']}\"")
            return user['Arn']
        except ClientError as e:
            _util_handle_error(e)

    def delete_user(self, user_name):
        try:
            self.client.delete_user(UserName=user_name)
            _util_print(f'User "{user_name}"', 'deleted')
        except ClientError as e:
            _util_handle_error(e)

    def attach_user_policy(self, user_name, policy_arn):
        try:
            self.client.attach_user_policy(UserName=user_name, PolicyArn=policy_arn)
            _util_print(f'User "{user_name}"', f'attached policy "{policy_arn}"')
        except ClientError as e:
            _util_handle_error(e)

    def detach_user_policy(self, user_name, policy_arn):
        try:
            self.client.detach_user_policy(UserName=user_name, PolicyArn=policy_arn)
            _util_print(f'User "{user_name}"', f'detached policy "{policy_arn}"')
        except ClientError as e:
            _util_handle_error(e)

    def assign_access_key(self, user_name):
        try:
            response = self.client.create_access_key(UserName=user_name)
            access_key = response['AccessKey']
            _util_print(f"User \"{access_key['UserName']}\"", 'assigned access key')
            return {
                'aws_access_key_id': access_key['AccessKeyId'],
                'aws_secret_access_key': access_key['SecretAccessKey']
            }
        except ClientError as e:
            _util_handle_error(e)

    def delete_access_key(self, user_name, access_key_id):
        try:
            self.client.delete_access_key(UserName=user_name, AccessKeyId=access_key_id)
            _util_print(f'User "{user_name}"', f'deleted access key "{access_key_id}"')
        except ClientError as e:
            _util_handle_error(e)

    def create_role(self, role_name, trust_policy, description=None):
        try:
            response = self.client.create_role(
                Path=IAM_PATH,
                RoleName=role_name,
                AssumeRolePolicyDocument=trust_policy,
                Description=description)
            role = response['Role']
            _util_print(f"Role \"{role['RoleName']}\"", f"created with id \"{role['RoleId']}\"")
            return role['Arn']
        except ClientError as e:
            _util_handle_error(e)

    def delete_role(self, role_name):
        try:
            self.client.delete_role(RoleName=role_name)
            _util_print(f'Role "{role_name}"', 'deleted')
        except ClientError as e:
            _util_handle_error(e)

    def attach_role_policy(self, role_name, policy_arn):
        try:
            self.client.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
            _util_print(f'Role "{role_name}"', f'attached policy "{policy_arn}"')
        except ClientError as e:
            _util_handle_error(e)

    def detach_role_policy(self, role_name, policy_arn):
        try:
            self.client.detach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
            _util_print(f'Role "{role_name}"', f'detached policy "{policy_arn}"')
        except ClientError as e:
            _util_handle_error(e)

    def create_policy(self, policy_name, policy_doc, description=None):
        try:
            result = self.client.create_policy(
                PolicyName=policy_name,
                Path=IAM_PATH,
                PolicyDocument=policy_doc,
                Description=description)
            policy = result['Policy']
            _util_print(f"Policy \"{policy['PolicyName']}\"", f"created with id \"{policy['PolicyId']}\"")
            return policy['Arn']
        except ClientError as e:
            _util_handle_error(e)

    def delete_policy(self, policy_name, policy_arn):
        try:
            self.client.delete_policy(PolicyArn=policy_arn)
            _util_print(f'Policy "{policy_name}"', 'deleted')
        except ClientError as e:
            _util_handle_error(e)
