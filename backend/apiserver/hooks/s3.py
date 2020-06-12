from http import HTTPStatus
from pprint import pprint

from flask import current_app, request

from . import webhook_blueprint


@webhook_blueprint.route('/s3/events', methods=['HEAD', 'POST'])
def get_bucket_notification():
    if request.method == 'HEAD':
        return '', HTTPStatus.OK

    if request.headers.get('Authorization') != f'Bearer {current_app.config["S3_WEBHOOK_SECRET"]}':
        return '', HTTPStatus.UNAUTHORIZED

    # TODO
    print('S3 Notification received')
    pprint(request.headers)
    pprint(request.json)

    return '', HTTPStatus.OK
