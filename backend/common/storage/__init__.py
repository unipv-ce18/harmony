from ..backend_config import BackendConfig
from .storage import Storage


def _make_public_bucket_policy(bucket_name):
    import json
    return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "",
                "Effect": "Allow",
                "Principal": {"AWS": "*"},
                "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                "Resource": f"arn:aws:s3:::{bucket_name}"
            },
            {
                "Sid": "",
                "Effect": "Allow",
                "Principal": {"AWS": "*"},
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]})


def _make_bucket_notification(arn, events, suffix=None):
    conf = {
        'Arn': arn,
        'Events': events
    }
    if suffix is not None:
        conf['Filter'] = {
            'Key': {
                'FilterRules': [{'Name': 'suffix', 'Value': suffix}]
            }
        }

    # Minio supports only QueueConfigurations, in production this is to be replaced by SNS TopicConfigurations
    return {
        'QueueConfigurations': [conf],
        'TopicConfigurations': [],
        'CloudFunctionConfigurations': []
    }


def connect_storage(config: BackendConfig):
    import minio
    return minio.Minio(config.STORAGE_ENDPOINT,
                       access_key=config.STORAGE_ACCESS_KEY,
                       secret_key=config.STORAGE_SECRET_KEY,
                       secure=config.STORAGE_USE_TLS)


def get_storage_interface(config: BackendConfig):
    st = Storage(connect_storage(config))

    if config.STORAGE_AUTO_CONFIGURE:
        if not st.check_bucket_exist(config.STORAGE_BUCKET_REFERENCE):
            st.create_bucket(config.STORAGE_BUCKET_REFERENCE)
            st.minio_client.set_bucket_notification(config.STORAGE_BUCKET_REFERENCE,
                                                    _make_bucket_notification(config.STORAGE_NOTIFICATION_ARN,
                                                                              ['s3:ObjectCreated:*'], '.flac'))

        if not st.check_bucket_exist(config.STORAGE_BUCKET_TRANSCODED):
            st.create_bucket(config.STORAGE_BUCKET_TRANSCODED)
            st.minio_client.set_bucket_policy(config.STORAGE_BUCKET_TRANSCODED,
                                              _make_public_bucket_policy(config.STORAGE_BUCKET_TRANSCODED))

        if not st.check_bucket_exist(config.STORAGE_BUCKET_IMAGES):
            st.create_bucket(config.STORAGE_BUCKET_IMAGES)
            st.minio_client.set_bucket_policy(config.STORAGE_BUCKET_IMAGES,
                                              _make_public_bucket_policy(config.STORAGE_BUCKET_IMAGES))

    return st


def get_transcoded_songs_bucket_url(config: BackendConfig):
    scheme = 'https' if config.STORAGE_USE_TLS else 'http'
    return f'{scheme}://{config.STORAGE_ENDPOINT_PUBLIC}/{config.STORAGE_BUCKET_TRANSCODED}'
