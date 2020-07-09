from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.contracts import artist_contract as c


api = Api(api_blueprint)

_arg_parser_patch = RequestParser()\
    .add_argument('title')\
    .add_argument('lyrics')


@api.resource('/song/<song_id>')
class UpdateSong(Resource):
    method_decorators = [security.jwt_required]

    def patch(self, song_id):
        """Update song data
        ---
        tags: [misc]
        parameters:
          - in: path
            name: song_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the song to update
        requestBody:
          description: Update song data
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  title: {type: string, description: The song title}
                  lyrics: {type: string, description: The song lyrics}
              examples:
                0: {summary: 'Modify song', value: {'title': 'TITLE', 'lyrics': 'LYRICS'}}
        responses:
          204:  # No Content
            description: Song modified correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to modify this song
            content:
              application/json:
                example: {'message': 'No authorized to modify this song'}
          404:
            description: Song not found
            content:
              application/json:
                example: {'message': 'Song not found'}
        """
        data = _arg_parser_patch.parse_args()

        user_id = security.get_jwt_identity()
        title = data['title']
        lyrics = data['lyrics']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        song = db.get_song(song_id)
        if song is None:
            return {'message': 'Song not found'}, HTTPStatus.NOT_FOUND
        if song.artist.get(c.ARTIST_REF_CREATOR) != user_id:
            return {'message': 'No authorized to modify this song'}, HTTPStatus.UNAUTHORIZED

        if title is not None:
            db.change_title(song_id, title)
        if lyrics is not None:
            db.update_lyrics(song_id, lyrics)

        return None, HTTPStatus.NO_CONTENT

    def delete(self, song_id):
        """Delete a song
        ---
        tags: [misc]
        parameters:
          - in: path
            name: song_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the song to delete
        responses:
          204:  # No Content
            description: Song deleted correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to remove this song
            content:
              application/json:
                example: {'message': 'No authorized to remove this song'}
          404:
            description: Song not found
            content:
              application/json:
                example: {'message': 'Song not found'}
        """
        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        song = db.get_song(song_id)
        if song is None:
            return {'message': 'Song not found'}, HTTPStatus.NOT_FOUND
        if song.artist.get(c.ARTIST_REF_CREATOR) != user_id:
            return {'message': 'No authorized to remove this song'}, HTTPStatus.UNAUTHORIZED

        db.remove_song(song_id)
        db.remove_song_from_playlists(song_id)
        db.remove_song_from_libraries(song_id)

        db.put_content(None, None, 'audio/flac', song_id)   # take advantage of the terminator to remove the song from storage

        return None, HTTPStatus.NO_CONTENT
