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

    def put(self):
        """Add an item to the user's library
        ---
        tags: [user]
        requestBody:
          $ref: '#components/requestBodies/LibrarySelector'
        responses:
          204:  # No Content
            description: Item inserted correctly
            content: {}
          409:  # Conflict
            description: Item already present in the library
            content:
              application/json:
                example: {'message': 'Already present'}
          400:  # Bad Request
            $ref: '#components/responses/InvalidId'
          404:  # Not Found
            $ref: '#components/responses/LibraryUpdateNoUser'
        """
        return self._update_op(db.add_media_to_library, False, 'Already present')

    def delete(self):
        """Remove an item to the user's library
        ---
        tags: [user]
        requestBody:
          $ref: '#components/requestBodies/LibrarySelector'
        responses:
          204:  # No Content
            description: Item removed successfully
            content: {}
          409:  # Conflict
            description: Item not present in the library
            content:
              application/json:
                example: {'message': 'Not present'}
          400:  # Bad Request
            $ref: '#components/responses/InvalidId'
          404:  # Not Found
            $ref: '#components/responses/LibraryUpdateNoUser'
        """
        return self._update_op(db.pull_media_from_library, True, 'Not present')

    @staticmethod
    def _update_op(operation, media_present, fail_msg):
        data = _arg_parser_prefs.parse_args()

        user_id = security.get_jwt_identity()
        media_type = data['media_type']
        media_id = data['media_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST
        if not ObjectId.is_valid(media_id):
            return {'message': 'Media ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.media_in_library(user_id, media_type, media_id) != media_present:
            return {'message': fail_msg}, HTTPStatus.CONFLICT

        # TODO: Should we check if the artist/release/song exists in the DB first?
        response = operation(user_id, media_type, media_id)

        if response:
            return None, HTTPStatus.NO_CONTENT
        return {'message': 'User not found'}, HTTPStatus.NOT_FOUND


@api.resource('/<user_id>/library')
class GetLibrary(Resource):
    method_decorators = [security.jwt_required]

    def get(self, user_id):
        """Retrieve an user's library
        ---
        tags: [user]
        parameters:
          - in: path
            name: user_id
            schema:
              type: string
            required: true
            description: The ID of the user or `me` for the currently logged in user
            example: me
          - in: query
            name: full
            schema:
              type: boolean
            required: false
            description: Whenever to resolve library
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
            $ref: '#components/responses/InvalidId'
          404:
            description: Library not found
            content:
              application/json:
                example: {'message': 'No library'}
        """
        if user_id == 'me':
            user_id = security.get_jwt_identity()

        _func = lambda type, id : {
            'artists': db.get_artist_for_library(id),
            'releases': db.get_release_for_library(id),
            'songs': db.get_song_for_library(id)
        }.get(type)
        _action = lambda type : library[type] if not resolve_library \
            else [_func(type, id).to_dict() for id in library[type]]
        _resolve = lambda type : _action(type) if type in library else []

        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        args = _arg_parser_library.parse_args()
        resolve_library = args['full'] in ['1', 'true', 'yes']

        library = db.get_library(user_id)

        if library is None:
            return {'message': 'No library'}, HTTPStatus.NOT_FOUND

        library['artists'] = _resolve('artists')
        library['releases'] = _resolve('releases')
        library['songs'] = _resolve('songs')

        #if not all(v == [] for v in library.values()):
        return library, HTTPStatus.OK
        #return {'message': 'No library'}, HTTPStatus.NOT_FOUND
