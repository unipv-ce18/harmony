from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint, prefix='/user')

_arg_parser_prefs = RequestParser()\
    .add_argument('media_type', required=True)\
    .add_argument('media_id', required=True)
_arg_parser_library = RequestParser().add_argument('full')


@api.resource('/library')
class UpdateLibrary(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Update the user library
        ---
        tags: [user]
        security: [accessToken: []]
        requestBody:
          description: Media to add/pull in/from the library
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  media_type: {type: string, description: The media type (artists - releases - songs)}
                  media_id: {type: string, description: The media id}
                required: [media_type, media_id]
              examples:
                0: {summary: 'Update library', value: {'media_type': 'artists', 'media_id': '5eb57db6519f4f9bdbba7ee0'}}
        responses:
          200:
            description: Successful library update
            content:
              application/json:
                example: {'message': 'Updated preferences'}
          400:
            description: Id not valid
            content:
              application/json:
                example: {'message': 'Id not valid'}
          403:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
        """
        data = _arg_parser_prefs.parse_args()

        user_id = security.get_jwt_identity()
        media_type = data['media_type']
        media_id = data['media_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User id not valid'}, HTTPStatus.BAD_REQUEST
        if not ObjectId.is_valid(media_id):
            return {'message': 'Media id not valid'}, HTTPStatus.BAD_REQUEST

        if db.media_in_library(user_id, media_type, media_id):
            response = db.pull_media_from_library(user_id, media_type, media_id)
        else:
            response = db.add_media_to_library(user_id, media_type, media_id)

        if response:
            return {'message': 'Updated preferences'}, HTTPStatus.OK
        return {'message': 'User not found'}, HTTPStatus.FORBIDDEN


@api.resource('/<user_id>/library')
class GetLibrary(Resource):
    def get(self, user_id):
        """Retrieve the user library
        ---
        tags: [user]
        security: []
        parameters:
          - in: path
            name: user_id
            type: string
            required: true
        responses:
          200:
            description: Successful library retrieve
            content:
              application/json:
                example: {
                  'artists': [
                    {
                      'id': '5dfd65de57475213eea241b3',
                      'name': 'Queens of the Stone Age',
                      'image': 'IMAGE URL'
                    },
                    {
                      'id': '5eb57db6519f4f9bdbba7ee0',
                      'name': 'Jack Stauber',
                      'image': 'IMAGE URL'}
                  ],
                  'releases': [
                    {
                      'id': '5eb57db6519f4f9bdbba7ee1',
                      'name': 'Pop Food',
                      'artist': {
                        'id': '5eb57db6519f4f9bdbba7ee0',
                        'name': 'Jack Stauber'
                      },
                      'cover': 'IMAGE URL'
                    }
                  ],
                  'songs': [
                    {
                      'id': '5eb57db6519f4f9bdbba7ee2',
                      'title': 'Buttercup',
                      'artist': {
                        'id': '5eb57db6519f4f9bdbba7ee0',
                        'name': 'Jack Stauber'
                      },
                      'release': {
                        'id': '5eb57db6519f4f9bdbba7ee1',
                        'name': 'Pop Food',
                        'date': '2017',
                        'type': 'album',
                        'cover': 'IMAGE URL'
                      },
                    }
                  ]
                }
          400:
            description: User id not valid
            content:
              application/json:
                example: {'message': 'Id not valid'}
          404:
            description: Library not found
            content:
              application/json:
                example: {'message': 'No library'}
        """
        _func = lambda type, id : {
            'artists': db.get_artist_for_library(id),
            'releases': db.get_release_for_library(id),
            'songs': db.get_song_for_library(id)
        }.get(type)
        _action = lambda type : library[type] if not resolve_library \
            else [_func(type, id).to_dict() for id in library[type]]
        _resolve = lambda type : _action(type) if type in library else []

        if not ObjectId.is_valid(user_id):
            return {'message': 'Id not valid'}, HTTPStatus.BAD_REQUEST

        args = _arg_parser_library.parse_args()
        resolve_library = args['full'] == '1'

        library = db.get_library(user_id)

        if library is None:
            return {'message': 'No library'}, HTTPStatus.NOT_FOUND

        library['artists'] = _resolve('artists')
        library['releases'] = _resolve('releases')
        library['songs'] = _resolve('songs')

        if not all(v == [] for v in library.values()):
            return library, HTTPStatus.OK
        return {'message': 'No library'}, HTTPStatus.NOT_FOUND
