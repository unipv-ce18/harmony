from ..backend_config import BackendConfig
from .storage import Storage


def _conf_value(config, key):
    # To account for flask configuration in API being a dict
    return config[key] if isinstance(config, dict) else getattr(config, key)


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


def _create_presigned_post_policy(bucket_name, content_id, mimetype, size):
    from datetime import datetime, timedelta
    from minio import PostPolicy

    post_policy = PostPolicy()
    post_policy.set_bucket_name(bucket_name)
    post_policy.set_key_startswith(content_id)
    post_policy.set_content_length_range(size, size)
    post_policy.set_content_type(mimetype)
    expires_date = datetime.utcnow() + timedelta(days=1)
    post_policy.set_expires(expires_date)

    return post_policy


def connect_storage(config):
    import minio
    return minio.Minio(_conf_value(config, 'STORAGE_ENDPOINT'),
                       access_key=_conf_value(config, 'STORAGE_ACCESS_KEY'),
                       secret_key=_conf_value(config, 'STORAGE_SECRET_KEY'),
                       secure=_conf_value(config, 'STORAGE_USE_TLS'),
                       region=_conf_value(config, 'STORAGE_REGION'))


def get_storage_interface(config):
    st = Storage(connect_storage(config))

    if _conf_value(config, 'STORAGE_AUTO_CONFIGURE'):
        if not st.check_bucket_exist(_conf_value(config, 'STORAGE_BUCKET_REFERENCE')):
            st.create_bucket(_conf_value(config, 'STORAGE_BUCKET_REFERENCE'))
            st.minio_client.set_bucket_notification(_conf_value(config, 'STORAGE_BUCKET_REFERENCE'),
                                                    _make_bucket_notification(_conf_value(config, 'STORAGE_NOTIFICATION_ARN'),
                                                                              ['s3:ObjectCreated:*']))

        if not st.check_bucket_exist(_conf_value(config, 'STORAGE_BUCKET_TRANSCODED')):
            st.create_bucket(_conf_value(config, 'STORAGE_BUCKET_TRANSCODED'))
            st.minio_client.set_bucket_policy(_conf_value(config, 'STORAGE_BUCKET_TRANSCODED'),
                                              _make_public_bucket_policy(_conf_value(config, 'STORAGE_BUCKET_TRANSCODED')))

        if not st.check_bucket_exist(_conf_value(config, 'STORAGE_BUCKET_MODIFIED')):
            st.create_bucket(_conf_value(config, 'STORAGE_BUCKET_MODIFIED'))
            st.minio_client.set_bucket_policy(_conf_value(config, 'STORAGE_BUCKET_MODIFIED'),
                                              _make_public_bucket_policy(_conf_value(config, 'STORAGE_BUCKET_MODIFIED')))

        if not st.check_bucket_exist(_conf_value(config, 'STORAGE_BUCKET_IMAGES')):
            st.create_bucket(_conf_value(config, 'STORAGE_BUCKET_IMAGES'))
            st.minio_client.set_bucket_policy(_conf_value(config, 'STORAGE_BUCKET_IMAGES'),
                                              _make_public_bucket_policy(_conf_value(config, 'STORAGE_BUCKET_IMAGES')))
            st.minio_client.set_bucket_notification(_conf_value(config, 'STORAGE_BUCKET_IMAGES'),
                                                    _make_bucket_notification(
                                                        _conf_value(config, 'STORAGE_NOTIFICATION_ARN'),
                                                        ['s3:ObjectCreated:*']))

    return st


def get_storage_base_url(config):
    scheme = 'https' if _conf_value(config, 'STORAGE_USE_TLS') else 'http'
    return f"{scheme}://{_conf_value(config, 'STORAGE_ENDPOINT_PUBLIC')}/"


def get_reference_songs_post_policy(config, content_id, mimetype, size):
    st = get_storage_interface(config)
    return st.minio_client.presigned_post_policy(_create_presigned_post_policy(_conf_value(config, 'STORAGE_BUCKET_REFERENCE'), content_id, mimetype, size))


def get_images_post_policy(config, content_id, mimetype, size):
    st = get_storage_interface(config)
    return st.minio_client.presigned_post_policy(_create_presigned_post_policy(_conf_value(config, 'STORAGE_BUCKET_IMAGES'), content_id, mimetype, size))
