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
          description: Playlist to add to the system
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
        data['songs'] = []

        playlist_id = db.put_playlist(playlist_from_document(data))

        if playlist_id:
            db.add_media_to_library(user_id, 'playlists', playlist_id)
            return {'message': 'Playlist created'}, HTTPStatus.CREATED
        else:
            return {'message': 'Failed to create new playlist'}, HTTPStatus.INTERNAL_SERVER_ERROR
