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
    content_type = object['contentType'].split('/')[0]
    content_name = object['key']
    content_id = content_name.split('.')[0]

    if content_type == 'image':
        cat_info = db.get_content_category_info(content_id)
        category = cat_info['category']
        category_id = cat_info['category_id']

        result = {
            'user': db.update_avatar_url(category_id, content_name),
            'artist': db.update_artist_image(category_id, content_name),
            'release': db.update_release_cover(category_id, content_name)
        }.get(category)

        db.remove_content(content_id)

    if content_type == 'audio':
        db.mark_complete_upload(content_id)

    return {'message': 'ok'}, HTTPStatus.OK
