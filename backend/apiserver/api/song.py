from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.contracts import artist_contract as c


api = Api(api_blueprint, prefix='/song')

_arg_parser_lyrics = RequestParser()\
    .add_argument('song_id', required=True)\
    .add_argument('lyrics', required=True)
_arg_parser_title = RequestParser()\
    .add_argument('song_id', required=True)\
    .add_argument('title', required=True)
_arg_parser_song = RequestParser()\
    .add_argument('song_id', required=True)


@api.resource('/lyrics')
class AddLyricsSong(Resource):
    method_decorators = [security.jwt_required]

    def patch(self):
        """Update lyrics of a song
        ---
        tags: [misc]
        requestBody:
          description: Modify the lyrics
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: The song id}
                  lyrics: {type: string, description: The song lyrics}
                required: [song_id, lyrics]
              examples:
                0: {summary: 'Modify lyrics', value: {'song_id': 'SONG_ID', 'lyrics': 'LYRICS'}}
        responses:
          204:  # No Content
            description: Lyrics modified correctly
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
        data = _arg_parser_lyrics.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data['song_id']
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

        if db.update_lyrics(song_id, lyrics):
            return None, HTTPStatus.NO_CONTENT
        return {'message': 'Song not found'}, HTTPStatus.NOT_FOUND


@api.resource('/title')
class ChangeSongTitle(Resource):
    method_decorators = [security.jwt_required]

    def patch(self):
        """Change the title of a song
        ---
        tags: [misc]
        requestBody:
          description: Modify the title
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: The song id}
                  title: {type: string, description: The song title}
                required: [song_id, title]
              examples:
                0: {summary: 'Modify title', value: {'song_id': 'SONG_ID', 'title': 'TITLE'}}
        responses:
          204:  # No Content
            description: Title modified correctly
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
        data = _arg_parser_title.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data['song_id']
        title = data['title']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        song = db.get_song(song_id)
        if song is None:
            return {'message': 'Song not found'}, HTTPStatus.NOT_FOUND
        if song.artist.get(c.ARTIST_REF_CREATOR) != user_id:
            return {'message': 'No authorized to modify this song'}, HTTPStatus.UNAUTHORIZED

        if db.change_title(song_id, title):
            return None, HTTPStatus.NO_CONTENT
        return {'message': 'Song not found'}, HTTPStatus.NOT_FOUND


@api.resource('/remove')
class RemoveSong(Resource):
    method_decorators = [security.jwt_required]

    def delete(self):
        """Delete a song
        ---
        tags: [misc]
        requestBody:
          description: Delete a song
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: The song id}
                required: [song_id]
              examples:
                0: {summary: 'Delete a song', value: {'song_id': 'SONG_ID'}}
        responses:
          204:  # No Content
            description: Title modified correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to modify this song
            content:
              application/json:
                example: {'message': 'No authorized to remove this song'}
          404:
            description: Song not found
            content:
              application/json:
                example: {'message': 'Song not found'}
        """
        data = _arg_parser_song.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data['song_id']

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
