from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ._conversions import create_artist_result, create_release_result, create_song_result
from ..util import security
from common.database.contracts import user_contract as c


api = Api(api_blueprint, prefix='/user')

_arg_parser_prefs = RequestParser()\
    .add_argument('media_type', required=True)\
    .add_argument('media_id', required=True)
_arg_parser_library = RequestParser().add_argument('full')


def _library_get(media_type, media_id): return {
    c.LIBRARY_PLAYLISTS: db.get_playlist_for_library,
    c.LIBRARY_ARTISTS: db.get_artist_for_library,
    c.LIBRARY_RELEASES: db.get_release_for_library,
    c.LIBRARY_SONGS: db.get_song_for_library
}.get(media_type)(media_id)


def _make_result(media_type, model): return {
    c.LIBRARY_PLAYLISTS: lambda p: p.to_dict(),
    c.LIBRARY_ARTISTS: create_artist_result,
    c.LIBRARY_RELEASES: create_release_result,
    c.LIBRARY_SONGS: create_song_result
}.get(media_type)(model)


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

        result = _library_get(media_type, media_id)

        if result is None:
            return {'message': 'Media ID not found'}, HTTPStatus.BAD_REQUEST

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
        def _resolve(lib_type):
            if library[lib_type] is None:
                return []

            if not resolve_library:
                return library[lib_type]

            return [_make_result(lib_type, _library_get(lib_type, item_id)) for item_id in library[lib_type]]

        if user_id == 'me':
            user_id = security.get_jwt_identity()
        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        args = _arg_parser_library.parse_args()
        resolve_library = args['full'] in ['1', 'true', 'yes']

        library = db.get_library(user_id).to_dict()
        personal = db.get_creator_playlists_id(security.get_jwt_identity())

        if library is None:
            return {'message': 'No library'}, HTTPStatus.NOT_FOUND

        # get personal playlist id inside library user
        personal = list(set(personal) & set(library[c.LIBRARY_PLAYLISTS])) \
            if library[c.LIBRARY_PLAYLISTS] is not None else library[c.LIBRARY_PLAYLISTS]

        # get others playlist id inside library user
        others = list(set(library[c.LIBRARY_PLAYLISTS]) - set(personal)) \
            if library[c.LIBRARY_PLAYLISTS] is not None else library[c.LIBRARY_PLAYLISTS]

        library[c.LIBRARY_PLAYLISTS] = personal
        personal_playlists = _resolve(c.LIBRARY_PLAYLISTS)

        library[c.LIBRARY_PLAYLISTS] = others
        others_playlists = _resolve(c.LIBRARY_PLAYLISTS)

        library[c.LIBRARY_PLAYLISTS] = {'personal': personal_playlists, 'others': others_playlists}
        library[c.LIBRARY_ARTISTS] = _resolve(c.LIBRARY_ARTISTS)
        library[c.LIBRARY_RELEASES] = _resolve(c.LIBRARY_RELEASES)
        library[c.LIBRARY_SONGS] = _resolve(c.LIBRARY_SONGS)

        return library, HTTPStatus.OK
