import os
from http import HTTPStatus

from bson import ObjectId
from flask import current_app
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
import apiserver.config as config
from common.database.contracts import artist_contract as c
from common.storage import get_reference_songs_post_policy, get_images_post_policy


api = Api(api_blueprint)

_arg_parser_content = RequestParser()\
    .add_argument('category', required=True)\
    .add_argument('category_id', required=True)\
    .add_argument('mimetype', required=True)\
    .add_argument('size', type=int, required=True)


@api.resource('/upload')
class UploadContent(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Upload content
        ---
        tags: [misc]
        requestBody:
          description: Content to upload
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  category: {type: string, description: The category of the content to upload}
                  category_id: {type: string, description: The ID of the category where the content will be uploaded}
                  mimetype: {type: string, description: The MIMEtype}
                  size: {type: int, description: Size of the object to upload}
                required: [category, category_id, mimetype, size]
              examples:
                0: {summary: 'Image type', value: {'category': 'user', 'category_id': 'me', mimetype: 'image/png', 'size': 1024}}
                1: {summary: 'Audio type', value: {'category': 'song', 'category_id': 'RELEASE_ID', mimetype: 'audio/flac', 'size': 1024}}
        responses:
          200:
            description: URL to upload and ID of the content
            content:
              application/json:
                example: {'url': 'URL', 'id': 'ID'}
          400:
            description: ID not valid
            content:
              application/json:
                example: {'message': 'ID not valid'}
          401:
            description: The user logged in is not authorized to upload the content for that category
            content:
              application/json:
                example: {'message': 'No authorized to upload this content'}
        """
        conf = current_app.config
        data = _arg_parser_content.parse_args()

        user_id = security.get_jwt_identity()
        category = data['category']
        category_id = data['category_id']
        mimetype = data['mimetype']
        content_type = mimetype.split('/')[0]
        size = data['size']

        if category == 'user':
            category_id = user_id

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(category_id):
            return {'message': 'Category ID not valid'}, HTTPStatus.BAD_REQUEST

        result = {
            'user': db.get_user,
            'artist': db.get_artist,
            'release': db.get_release,
            'song': db.get_release
        }.get(category)(category_id)

        if result is None:
            return {'message': 'Category ID not found'}, HTTPStatus.BAD_REQUEST

        if category != 'user':
            if category == 'artist':
                if result.creator != user_id:
                    return {'message': 'No authorized to upload this content'}, HTTPStatus.UNAUTHORIZED
            else:
                if result.artist.get(c.ARTIST_REF_CREATOR) != user_id:
                    return {'message': 'No authorized to upload this content'}, HTTPStatus.UNAUTHORIZED

        if category == 'song' and mimetype != 'audio/flac':
            return {'message': 'A song must be a FLAC audio'}, HTTPStatus.BAD_REQUEST

        if content_type != 'image' and category != 'song':
             return {'message': 'Content type must be image'}, HTTPStatus.BAD_REQUEST

        content_id = db.put_content(category, category_id, mimetype)

        result = {
            'image': {
                'url': get_images_post_policy(conf, content_id, mimetype, size)
            },
            'audio': {
                'url': get_reference_songs_post_policy(conf, content_id, mimetype, size)
            }
        }.get(content_type)

        url, params = result['url']
        url = url.replace(conf['STORAGE_ENDPOINT'], conf['STORAGE_ENDPOINT_PUBLIC'])

        return (url, params), HTTPStatus.OK
