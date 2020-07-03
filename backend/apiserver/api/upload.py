import os
from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
import apiserver.config as config
from common.storage import get_reference_songs_bucket_url, get_images_bucket_url
from common.database.contracts import artist_contract as c
from common.database.codecs import song_from_document


api = Api(api_blueprint)

_arg_parser_content = RequestParser()\
    .add_argument('category', required=True)\
    .add_argument('category_id', required=True)\
    .add_argument('mimetype', required=True)\
    .add_argument('size', type=int, required=True)

_arg_parser_song = RequestParser()\
    .add_argument('song_id', required=True)\
    .add_argument('title', required=True)\
    .add_argument('length', type=int, required=True)\
    .add_argument('lyrics')


@api.resource('/uploadContent')
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
                  name: {type: string, description: The desired name}
                required: [content_type]
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
            description: User ID not valid
            content:
              application/json:
                example: {'message': 'User ID not valid'}
        """
        conf = config[os.environ.get('FLASK_CONFIG', 'development')]
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
            result = result.to_dict()
            if category == 'artist':
                if result['creator'] != user_id:
                    return {'message': 'No authorized to modify this content'}, HTTPStatus.UNAUTHORIZED
            if result['artist']['creator'] != user_id:
                    return {'message': 'No authorized to modify this content'}, HTTPStatus.UNAUTHORIZED

        if category == 'song' and mimetype != 'audio/flac':
            return {'message': 'A song must be a FLAC audio'}, HTTPStatus.BAD_REQUEST

        if content_type != 'image' and category != 'song':
             return {'message': 'Content type must be image'}, HTTPStatus.BAD_REQUEST

        content_id = db.put_content(category, category_id, mimetype)

        result = {
            'image': {
                'url': get_images_bucket_url(conf, content_id, mimetype, size)
            },
            'audio': {
                'url': get_reference_songs_bucket_url(conf, content_id, mimetype, size)
            }
        }.get(content_type)
        result['id'] = content_id

        return result, HTTPStatus.OK


@api.resource('/songUpload')
class SongUpload(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Complete the upload of a song
        ---
        tags: [misc]
        requestBody:
          description: Song metadata to upload
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  name: {type: string, description: Song}
              examples:
                0: {summary: 'Song', value: {'song_id': 'SONG_ID', 'title': 'SONG_TITLE', 'LENGTH': 123, 'lyrics': ''}}
        responses:
          200:
            description: Song uploaded successfully
            content:
              application/json:
                example: {'message': 'Upload completed'}
          400:
            description: ID not valid
            content:
              application/json:
                example: {'message': 'ID not valid'}
        """
        data = _arg_parser_song.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data[c.SONG_ID] = data['song_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_content_status(song_id) != 'complete':
            return {'message': 'Upload on storage not complete'}, HTTPStatus.BAD_REQUEST

        release_info = db.get_content_category_info(song_id)
        release_id = release_info['category_id']

        db.put_song(release_id, song_from_document(data), False)
        db.remove_content(song_id)

        return {'message': 'Upload completed'}, HTTPStatus.OK
