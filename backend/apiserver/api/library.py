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
        _func = lambda type : {
            'artists': db.get_artist_for_library,
            'releases': db.get_release_for_library,
            'songs': db.get_song_for_library
        }.get(type)

        def _resolve(type):
            if library[type] is None:
                return []
            if not resolve_library:
                return library[type]
            if type == 'playlists':
                for playlist in library[type]:
                    for k, v in playlist.items():
                        if k != 'id' and k != 'name':
                            playlist[k] = db.get_user_for_library(v).to_dict() if not isinstance(v, list) \
                                else [db.get_song_for_library(song_id).to_dict() for song_id in v]
                return library[type]
            return [_func(type)(id).to_dict() for id in library[type]]

        if user_id == 'me':
            user_id = security.get_jwt_identity()
        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        args = _arg_parser_library.parse_args()
        resolve_library = args['full'] in ['1', 'true', 'yes']

        library = db.get_library(user_id).to_dict()

        if library is None:
            return {'message': 'No library'}, HTTPStatus.NOT_FOUND

        library['playlists'] = _resolve('playlists')
        library['artists'] = _resolve('artists')
        library['releases'] = _resolve('releases')
        library['songs'] = _resolve('songs')

        return library, HTTPStatus.OK
