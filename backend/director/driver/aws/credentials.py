from dataclasses import dataclass
import datetime

# From hyaws/config/credentials.py
@dataclass
class AwsCredentials:
    aws_access_key_id: str
    """The account's access key"""

    aws_secret_access_key: str
    """The account's secret access key"""

    aws_session_token: str = None
    """The session token to use, typically needed only when using temporary credentials"""

    expiration: datetime.datetime = None
    """Expiration of this set of temporary credentials (meaningful only if session token is defined)"""
