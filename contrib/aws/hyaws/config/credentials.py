import configparser
from dataclasses import dataclass

CREDENTIALS_FILE = './credentials'


@dataclass
class AwsCredentials:
    aws_access_key_id: str
    """The account's access key"""

    aws_secret_access_key: str
    """The account's secret access key"""

    aws_session_token: str = None
    """The session token to use, typically needed only when using temporary credentials"""


def _load_credentials(file):
    cp = configparser.ConfigParser()
    cp.read(file)
    return {sect: AwsCredentials(**cp[sect]) for sect in cp.sections()}


credentials = _load_credentials(CREDENTIALS_FILE)
