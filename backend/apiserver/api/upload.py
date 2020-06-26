import os
from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
import apiserver.config as config
from common.storage import get_reference_songs_bucket_url, get_images_bucket_url


api = Api(api_blueprint)

_arg_parser_content = RequestParser()\
    .add_argument('content_type', required=True)\
    .add_argument('content_format', required=True)


@api.resource('/uploadContent')
class UploadContent(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Upload content
        ---
        tags: [misc]
        requestBody:
          description: Content type to upload
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  name: {type: string, description: The desired name}
                required: [content_type]
              examples:
                0: {summary: 'Image type', value: {'content_type': 'image', 'content_format': 'png'}}
                1: {summary: 'Audio type', value: {'content_type': 'audio', 'content_format': 'flac'}}
        responses:
          200:
            description: URL to upload and ID of the content
            content:
              application/json:
                example: {'url': 'URL', 'id': 'ID'}
          400:
            description: User ID not valid
            content:
              application/json:
                example: {'message': 'User ID not valid'}
        """
        conf = config[os.environ.get('FLASK_CONFIG', 'development')]
        data = _arg_parser_content.parse_args()

        user_id = security.get_jwt_identity()
        content_type = data['content_type']
        content_format = data['content_format']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        result = {
            'image': {
                'url': get_images_bucket_url(conf)
            },
            'audio': {
                'url': get_reference_songs_bucket_url(conf)
            }
        }.get(content_type)

        if result is not None:
            result['id'] = db.put_content(content_type, content_format)
            return result, HTTPStatus.OK
        return {'message': 'Content type not valid'}, HTTPStatus.BAD_REQUEST
