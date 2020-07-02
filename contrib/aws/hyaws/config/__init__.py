import sys
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError

from .credentials import AwsCredentials, credentials
from .deploy import deploy_def
from ..cli import print_credentials_error


@dataclass
class UserIdentity:
    user_id: str
    """The unique identifier of the caller"""

    account: str
    """The AWS account ID number of the account that owns or contains the caller"""

    arn: str
    """The AWS ARN associated with the caller"""


@dataclass
class Account:
    credentials: AwsCredentials
    """Credentials used to access the account"""

    identity: UserIdentity
    """The identity obtained from STS GetCallerIdentity"""

    description: str
    """The account's description"""


_get_accounts_result = {}


def get_accounts():
    """Obtains accounts from the deploy file that can be used

    :returns:
       A dict mapping resolved accounts to their IDs in the deploy file
       and a list of unresolved credentials file sections names
    :rtype: (dict, str[])
    """
    global _get_accounts_result
    if _get_accounts_result:
        return _get_accounts_result

    accounts = {}
    unresolved = []

    for sect, cred in credentials.items():
        ident = _fetch_user_identity(sect, cred)
        deploy_id, description = _match_deploy_account(ident.account)

        if deploy_id is not None:
            accounts[deploy_id] = Account(cred, ident, description)
        else:
            unresolved.append(sect)

    _get_accounts_result = (accounts, unresolved)
    return _get_accounts_result


def get_service_config(service_name):
    return deploy_def['services'][service_name]


def _fetch_user_identity(name: str, cred: AwsCredentials):
    try:
        response = boto3.client('sts', **cred.__dict__).get_caller_identity()
        return UserIdentity(
            user_id=response['UserId'],
            account=response['Account'],
            arn=response['Arn'])
    except ClientError as e:
        print_credentials_error(name, e)
        sys.exit(1)


def _match_deploy_account(account_id: str):
    for deploy_id, account in deploy_def['accounts'].items():
        if account['id'] == account_id:
            return deploy_id, account['description']
    return None, None
