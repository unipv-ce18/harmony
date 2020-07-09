from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ._conversions import create_playlist_result
from ..util import security


api = Api(api_blueprint)


@api.resource('/playlist/<playlist_id>')
class GetPlaylist(Resource):
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
