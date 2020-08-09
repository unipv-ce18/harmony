from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from ._conversions import create_playlist_result
from common.database.contracts import user_contract as uc
from common.database.contracts import playlist_contract as c
from common.database.codecs import playlist_from_document
from ._conversions import create_song_result


api = Api(api_blueprint, prefix='/playlist')

_arg_parser_create = RequestParser()\
    .add_argument('name', required=True)

_arg_parser_patch = RequestParser()\
    .add_argument('name')\
    .add_argument('policy')

_arg_parser_update = RequestParser()\
    .add_argument('song_id', required=True)


@api.resource('')
class CreatePlaylist(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Create a playlist
        ---
        tags: [metadata]
        requestBody:
          description: Playlist to create
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  name: {type: string, description: The desired name}
                required: [name]
              examples:
                0: {summary: 'New playlist', value: {'name': 'eheh'}}
        responses:
          201:
            description: A new playlist is created
            content:
              application/json:
                example: {'message': 'Playlist created'}
          500:
            description: Failed to create new playlist
            content:
              application/json:
                example: {'message': 'Failed to create new playlist'}
        """
        data = _arg_parser_create.parse_args()

        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        data[c.PLAYLIST_CREATOR] = {
            c.PLAYLIST_CREATOR_ID: user_id,
            c.PLAYLIST_CREATOR_USERNAME: db.get_user_username(user_id)
        }
        data[c.PLAYLIST_POLICY] = c.PLAYLIST_POLICY_PUBLIC
        data[c.PLAYLIST_IMAGES] = []
        data[c.PLAYLIST_SONGS] = []

        playlist_id = db.put_playlist(playlist_from_document(data))

        if playlist_id:
            db.add_media_to_library(user_id, uc.LIBRARY_PLAYLISTS, playlist_id)
            return {'playlist_id': playlist_id}, HTTPStatus.CREATED
        return {'message': 'Failed to create new playlist'}, HTTPStatus.INTERNAL_SERVER_ERROR


@api.resource('/<playlist_id>')
class PlaylistOptions(Resource):
    method_decorators = [security.jwt_required]

    def get(self, playlist_id):
        """Retrieve a playlist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: playlist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the playlist to fetch
        responses:
          200:
            description: Successful playlist retrieve
            content:
              application/json:
                example: {
                  'id': 'PLAYLIST ID',
                  'name': 'PLAYLIST NAME',
                  'creator': {
                    'id': 'PLAYLIST_CREATOR_ID',
                    'username': 'PLAYLIST_CREATOR_USERNAME'
                  },
                  'songs': ['PLAYLIST SONGS']
                }
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: Playlist not found
            content:
              application/json:
                example: {'message': 'Playlist not found'}
        """
        if not ObjectId.is_valid(playlist_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        playlist = db.get_playlist(playlist_id)

        if playlist is None:
            return {'message': 'Playlist not found'}, HTTPStatus.NOT_FOUND
        return create_playlist_result(playlist, True), HTTPStatus.OK

    def patch(self, playlist_id):
        """Modify playlist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: playlist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the playlist to modify
        requestBody:
          description: Modify the playlist
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  name: {type: string, description: The playlist name}
                  policy: {type: string, description: The playlist policy}
              examples:
                0: {summary: 'Modify playlist info', value: {'name': 'NEW NAME', 'policy': 'private'}}
        responses:
          204:  # No Content
            description: Policy modified correctly
            content: {}
          400:  # Bad Request
            $ref: '#components/responses/InvalidId'
          401:
            description: User is different from the creator
            content:
              application/json:
                example: {'message': 'You are not authorized to modify this playlist'}
          404:  # Not Found
            $ref: '#components/responses/LibraryUpdateNoUser'
        """
        data = _arg_parser_patch.parse_args()

        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST
        if not ObjectId.is_valid(playlist_id):
            return {'message': 'Playlist ID not valid'}, HTTPStatus.BAD_REQUEST

        name = data['name']
        policy = data['policy']

        patch_playlist = {}

        if name is not None:
            patch_playlist[c.PLAYLIST_NAME] = name
        if policy is not None:
            current_policy = db.get_policy(playlist_id)
            new_policy = c.PLAYLIST_POLICY_PUBLIC if current_policy == c.PLAYLIST_POLICY_PRIVATE \
                else c.PLAYLIST_POLICY_PRIVATE
            patch_playlist[c.PLAYLIST_POLICY] = new_policy

        if user_id == db.get_playlist_creator(playlist_id):
            if db.update_playlist(playlist_id, patch_playlist):
                return None, HTTPStatus.NO_CONTENT
        return {'message': 'You are not authorized to modify this playlist'}, HTTPStatus.UNAUTHORIZED

    def put(self, playlist_id):
        """Add a song to a playlist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: playlist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the playlist
        requestBody:
          description: Song to add to the playlist
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: The song id}
                required: [song_id]
              examples:
                0: {summary: 'Add song', value: {'song_id': 'SONG_ID'}}
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
          401:
            description: User is different from the creator
            content:
              application/json:
                example: {'message': 'You are not authorized to modify this playlist'}
          404:  # Not Found
            $ref: '#components/responses/LibraryUpdateNoUser'
        """
        return self._update_op(playlist_id, db.add_song_to_playlist, False, 'Already present')

    def delete(self, playlist_id):
        """Remove a song from a playlist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: playlist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the playlist
        requestBody:
          description: Song to remove from the playlist
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: The song id}
                required: [playlist_id, song_id]
              examples:
                0: {summary: 'Remove song', value: {'song_id': 'SONG_ID'}}
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
          401:
            description: User is different from the creator
            content:
              application/json:
                example: {'message': 'You are not authorized to modify this playlist'}
          404:  # Not Found
            $ref: '#components/responses/LibraryUpdateNoUser'
        """
        return self._update_op(playlist_id, db.pull_song_from_playlist, True, 'Not present')

    @staticmethod
    def _update_op(playlist_id, operation, song_present, fail_msg):
        data = _arg_parser_update.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data['song_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST
        if not ObjectId.is_valid(playlist_id):
            return {'message': 'Playlist ID not valid'}, HTTPStatus.BAD_REQUEST
        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.song_in_playlist(playlist_id, song_id) != song_present:
            return {'message': fail_msg}, HTTPStatus.CONFLICT

        if user_id == db.get_playlist_creator(playlist_id):

            song = db.get_song_for_library(song_id)

            if song is None:
                return {'message': 'Song ID not found'}, HTTPStatus.BAD_REQUEST

            cover = song.release.get('cover')

            release_id = song.release.get('id')
            release = db.get_release(release_id, True)
            for s in release.songs:
                if s.id != song_id and db.song_in_playlist(playlist_id, s.id):
                    cover = None

            response = operation(playlist_id, song_id, cover)

            if response:
                return None, HTTPStatus.NO_CONTENT
            return {'message': 'Playlist not found'}, HTTPStatus.NOT_FOUND
        return {'message': 'You are not authorized to modify this playlist'}, HTTPStatus.UNAUTHORIZED
