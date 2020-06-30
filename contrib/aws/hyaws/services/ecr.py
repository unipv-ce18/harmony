"""Configures the image registry on AWS"""
from ..cli import color_print, bcolors
from ..config import get_service_config
from ..service_util import requires_account, IAM, ECR
from ..service_util.policy import account_trust_relationship_policy, assume_role_policy

DELEGATE_ROLE_NAME = 'HYDelegateEcr'
ASSUME_ROLE_POLICY_NAME = 'AssumeEducateEcrRole'
ARN_POLICY_ECR_FULL_ACCESS = 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess'

ecr_conf = get_service_config('ecr')
management_account = ecr_conf['management-account']
service_account = ecr_conf['service-account']


@requires_account(management_account, service_account)
def command_user_setup(accounts):
    """Creates IAM policies, users and roles and returns credentials to be used by the CI/CD pipeline"""
    management_account_id = accounts[management_account].identity.account

    # Create a role for the management account in the service account and give it full access to ECR
    iam = IAM(service_account)
    ecr_role_arn = iam.create_role(DELEGATE_ROLE_NAME,
                                   trust_policy=account_trust_relationship_policy(management_account_id),
                                   description=f'Full access to ECR for "{management_account}"')
    iam.attach_role_policy(DELEGATE_ROLE_NAME, ARN_POLICY_ECR_FULL_ACCESS)

    # Create an user in the management account and allow it to assume the role, then assign an access token
    iam = IAM(management_account)
    ass_pol_arn = iam.create_policy(ASSUME_ROLE_POLICY_NAME,
                                    policy_doc=assume_role_policy(ecr_role_arn),
                                    description=f'Allows to assume role "{DELEGATE_ROLE_NAME}" in "{service_account}"')
    user_name = ecr_conf['ci-user']
    iam.create_user(user_name)
    iam.attach_user_policy(user_name, ass_pol_arn)
    keys = iam.assign_access_key(user_name)

    conf = {**keys, 'role_arn': ecr_role_arn, 'source_profile': 'default'}
    color_print(bcolors.WARNING + bcolors.BOLD, '\nDone! Use this configuration in your CI pipeline to push to ECR:')
    for k, v in conf.items():
        print(f'{k}={v}')


@requires_account(management_account, service_account)
def command_user_remove(_):
    """Rollbacks user-setup, effectively removing IAM configuration for ECR"""

    iam = IAM(service_account)
    iam.detach_role_policy(DELEGATE_ROLE_NAME, ARN_POLICY_ECR_FULL_ACCESS)
    iam.delete_role(DELEGATE_ROLE_NAME)

    iam = IAM(management_account)
    user_name = ecr_conf['ci-user']
    policy_arn = _find_user_policy_arn(iam, user_name, ASSUME_ROLE_POLICY_NAME)
    if policy_arn is None:
        raise RuntimeError(f'Cannot find "{ASSUME_ROLE_POLICY_NAME}" in user "{user_name}"')
    access_keys = iam.client.list_access_keys(UserName=user_name)['AccessKeyMetadata']

    iam.detach_user_policy(user_name, policy_arn)
    for key in access_keys:
        iam.delete_access_key(user_name, key['AccessKeyId'])
    iam.delete_user(user_name)
    iam.delete_policy(ASSUME_ROLE_POLICY_NAME, policy_arn)


@requires_account(service_account)
def command_create_repositories(_):
    """Creates ECR repositories for harmony images"""
    ecr = ECR(service_account, ecr_conf['region'])
    for name in ecr_conf['repositories']:
        ecr.create_repository(name)


@requires_account(service_account)
def command_delete_repositories(_):
    """Deletes ECR repositories created by create-repositories"""
    ecr = ECR(service_account, ecr_conf['region'])
    for name in ecr_conf['repositories']:
        ecr.delete_repository(name)


def _find_user_policy_arn(iam, user_name, policy_name):
    attached_policies = iam.client.list_attached_user_policies(UserName=user_name)['AttachedPolicies']
    for pol in attached_policies:
        if pol['PolicyName'] == policy_name:
            return pol['PolicyArn']
    return None
