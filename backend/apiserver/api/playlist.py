from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.codecs import playlist_from_document


api = Api(api_blueprint, prefix='/user/playlist')


_arg_parser_create_playlist = RequestParser().add_argument('name', required=True)
_arg_parser_update_playlist = RequestParser()\
    .add_argument('playlist_id', required=True)\
    .add_argument('song_id', required=True)


@api.resource('/create')
class CreatePlaylist(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Add a playlist to the user's library
        ---
        tags: [user]
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
        data = _arg_parser_create_playlist.parse_args()

        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        data['creator'] = user_id
        data['policy'] = 'public'
        data['songs'] = []

        playlist_id = db.put_playlist(playlist_from_document(data))

        if playlist_id:
            db.add_media_to_library(user_id, 'playlists', playlist_id)
            return {'playlist_id': playlist_id}, HTTPStatus.CREATED
        return {'message': 'Failed to create new playlist'}, HTTPStatus.INTERNAL_SERVER_ERROR


@api.resource('/update')
class UpdatePlaylist(Resource):
    method_decorators = [security.jwt_required]

    def put(self):
        """Add a song to a playlist
        ---
        tags: [user]
        requestBody:
          description: Song to add to the playlist
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  playlist_id: {type: string, description: The playlist id}
                  song_id: {type: string, description: The song id}
                required: [playlist_id, song_id]
              examples:
                0: {summary: 'Add song', value: {'playlist_id': 'PLAYLIST ID', 'song_id': 'SONG ID'}}
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
        return self._update_op(db.add_song_to_playlist, False, 'Already present')

    def delete(self):
        """Remove a song from a playlist
        ---
        tags: [user]
        requestBody:
          description: Song to remove from the playlist
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  playlist_id: {type: string, description: The playlist id}
                  song_id: {type: string, description: The song id}
                required: [playlist_id, song_id]
              examples:
                0: {summary: 'Remove song', value: {'playlist_id': 'PLAYLIST ID', 'song_id': 'SONG ID'}}
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
        return self._update_op(db.pull_song_from_playlist, True, 'Not present')

    @staticmethod
    def _update_op(operation, song_present, fail_msg):
        data = _arg_parser_update_playlist.parse_args()

        user_id = security.get_jwt_identity()
        playlist_id = data['playlist_id']
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
            response = operation(playlist_id, song_id)

            if response:
                return None, HTTPStatus.NO_CONTENT
            return {'message': 'Playlist not found'}, HTTPStatus.NOT_FOUND
        return {'message': 'You are not authorized to modify this playlist'}, HTTPStatus.UNAUTHORIZED
