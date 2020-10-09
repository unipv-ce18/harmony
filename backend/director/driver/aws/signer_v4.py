import datetime
import hashlib
import hmac
import platform
from urllib.parse import urlparse
from urllib.request import Request

from .credentials import AwsCredentials

SIGNING_ALGORITHM = 'AWS4-HMAC-SHA256'
DEFAULT_REGION = 'us-east-1'

REQUEST_CONTENT_TYPE_QUERY = 'application/x-www-form-urlencoded; charset=utf-8'
REQUEST_CONTENT_TYPE_JSON = 'application/x-amz-json-1.1'

USER_AGENT = 'hy-director/0.1 Python/%s %s/%s' % (platform.python_version(), platform.system(), platform.release())


def _build_canonical_request(method, url_data, headers, payload):
    canonical_headers = ''.join([f'{k.lower()}:{v}\n' for k, v in headers.items()])
    signed_headers = ';'.join(headers.keys()).lower()

    canonical_req = method + '\n' + \
                    url_data.path + '\n' + \
                    url_data.query + '\n' + \
                    canonical_headers + '\n' + \
                    signed_headers + '\n' +\
                    hashlib.sha256(payload).hexdigest()
    return canonical_req, signed_headers


# Key derivation functions, see:
# http://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-python
def _sign(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()


def _get_signature_key(key, date_stamp, region_name, service_name):
    k_date = _sign(('AWS4' + key).encode('utf-8'), date_stamp)
    k_region = _sign(k_date, region_name)
    k_service = _sign(k_region, service_name)
    k_signing = _sign(k_service, 'aws4_request')
    return k_signing


def _sign_request(amz_date, date_stamp, credential_scope, canonical_request, region, service, secret_key):
    # Create the string to sign
    string_to_sign = \
        SIGNING_ALGORITHM + '\n' + \
        amz_date + '\n' + \
        credential_scope + '\n' + \
        hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()

    # Calculate the signature
    signing_key = _get_signature_key(secret_key, date_stamp, region, service)
    return hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()


def make_signed_request(credentials: AwsCredentials, method, url, payload, json_amz_target=None):
    """Creates a request for Amazon AWS using Signature Version 4"""
    url_data = urlparse(url)
    host_split = url_data.netloc.split('.')
    if '.'.join(host_split[-2:]) != 'amazonaws.com':
        raise ValueError('Not an Amazon AWS API URL')

    if len(host_split) > 3:
        region = host_split[-3]
        service = host_split[-4]
    else:
        region = DEFAULT_REGION
        service = host_split[-3]

    time = datetime.datetime.utcnow()
    amz_date = time.strftime('%Y%m%dT%H%M%SZ')
    date_stamp = time.strftime('%Y%m%d')  # Date w/o time, used in credential scope
    credential_scope = f'{date_stamp}/{region}/{service}/aws4_request'

    # Create a canonical request
    pre_headers = {
        'Content-Type': REQUEST_CONTENT_TYPE_JSON if json_amz_target is not None else REQUEST_CONTENT_TYPE_QUERY,
        'Host': url_data.netloc,
        'User-Agent': USER_AGENT,
        'X-Amz-Date': amz_date
    }
    if credentials.aws_session_token is not None:
        pre_headers['X-Amz-Security-Token'] = credentials.aws_session_token
    canonical_request, signed_headers = _build_canonical_request(method, url_data, pre_headers, payload)

    # Sign the request
    signature = _sign_request(amz_date, date_stamp, credential_scope, canonical_request, region, service,
                              credentials.aws_secret_access_key)

    # Build the 'Authorization' header
    authorization_header = SIGNING_ALGORITHM + ' ' + \
                           'Credential=' + credentials.aws_access_key_id + '/' + credential_scope + ', ' + \
                           'SignedHeaders=' + signed_headers + ', ' + \
                           'Signature=' + signature

    # Generate X-Amz-Target for JSON requests
    headers = {**pre_headers, 'Authorization': authorization_header}
    if json_amz_target is not None:
        headers['X-Amz-Target'] = json_amz_target

    # Return the request
    return Request(url, payload, headers, method=method)
