from http import HTTPStatus

from flask import current_app, request

from . import webhook_blueprint, db


@webhook_blueprint.route('/s3/events', methods=['HEAD', 'POST'])
def get_bucket_notification():
    if request.method == 'HEAD':
        return '', HTTPStatus.OK

    if request.headers.get('Authorization') != f'Bearer {current_app.config["S3_WEBHOOK_SECRET"]}':
        return {'message': 'Unauthorized'}, HTTPStatus.UNAUTHORIZED

    print('S3 Notification received')

    object = request.json['Records'][0]['s3']['object']
    content_id = object['key'].split('.')[0]

    content = db.get_content(content_id)
    content_type = content['mimetype'].split('/')[0]

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
