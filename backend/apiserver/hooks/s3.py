import json
from http import HTTPStatus

from flask import current_app, request

from . import webhook_blueprint, db


@webhook_blueprint.route('/s3/events', methods=['HEAD', 'POST'])
def get_bucket_notification():
    if request.method == 'HEAD':
        return '', HTTPStatus.OK

    sns_msg_t = request.headers.get('x-amz-sns-message-type')
    msg = json.loads(request.data.decode('utf-8'))
    bucket_event = None
    
    if sns_msg_t == 'SubscriptionConfirmation':
        current_app.logger.warning(f'SNS subscription confirmation message received: open "{msg["SubscribeURL"]}" '
               'to validate this webhook endpoint')
        return '', HTTPStatus.NO_CONTENT

    elif sns_msg_t == 'Notification':
        current_app.logger.debug('S3 notification received')
        bucket_event = json.loads(msg['Message'])

    elif sns_msg_t is None and current_app.config["MINIO_WEBHOOK_SECRET"] is not None:
        if request.headers.get('Authorization') != f'Bearer {current_app.config["MINIO_WEBHOOK_SECRET"]}':
            return {'message': 'Unauthorized'}, HTTPStatus.UNAUTHORIZED

        current_app.logger.debug('Minio notification received')
        bucket_event = msg

    else:
        return {'message': 'Unhandled message'}, HTTPStatus.INTERNAL_SERVER_ERROR

    s3 = bucket_event['Records'][0]['s3']
    content_id = s3['object']['key']

    try:
        content = db.get_content(content_id)
        content_type = content['mimetype'].split('/')[0]
    except Exception as e:
        current_app.logger.error(f'Unknown pending upload for "{content_id}": {e}')
        return {'message': 'unknown object'}, HTTPStatus.OK

    if content_type == 'image':
        category = content['category']
        category_id = content['category_id']

        if category == 'user':
            old_pic = (db.get_user(category_id).to_dict())['avatar_url']
            db.update_avatar_url(category_id, content_id)
        if category == 'artist':
            old_pic = (db.get_artist(category_id)).image
            db.update_artist_image(category_id, content_id)
        if category == 'release':
            old_pic = (db.get_release(category_id)).cover
            db.update_release_cover(category_id, content_id)

        if old_pic is not None:
            db.put_content_to_delete('image', old_pic)

        db.remove_content(content_id)

    if content_type == 'audio':
        db.mark_complete_upload(content_id)

    return {'message': 'ok'}, HTTPStatus.OK
