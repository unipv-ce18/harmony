from http import HTTPStatus

from bson import ObjectId
from flask import current_app
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db, amqp_client
from ..util import security
from ._deletion import delete_song
from ..ws.notification_worker import NotificationWorker
import common.messaging.jobs as jobs
from common.database.contracts import artist_contract as c
from common.database.codecs import song_from_document


api = Api(api_blueprint, prefix='/song')

_arg_parser_upload = RequestParser()\
    .add_argument('song_id', required=True)\
    .add_argument('release_id', required=True)\
    .add_argument('title', required=True)\
    .add_argument('lyrics')

_arg_parser_patch = RequestParser()\
    .add_argument('title')\
    .add_argument('lyrics')


@api.resource('')
class SongUpload(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Complete the upload of a song
        ---
        tags: [metadata]
        requestBody:
          description: Song metadata to upload
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: Song ID}
                  release_id: {type: string, description: ID of the release to which the song is to be added}
                  title: {type: string, description: Song title}
                  lyrics: {type: string, description: Song lyrics}
                required: [song_id, title]
              examples:
                0: {summary: 'Song', value: {'song_id': 'SONG_ID', 'release_id': 'RELEASE_ID', 'title': 'SONG_TITLE', 'lyrics': ''}}
        responses:
          200:
            description: Song uploaded successfully
            content:
              application/json:
                example: {'message': 'Upload completed'}
          400:
            description: ID not valid
            content:
              application/json:
                example: {'message': 'ID not valid'}
          401:
            description: The user logged in is not authorized to upload this song
            content:
              application/json:
                example: {'message': 'No authorized to upload this song'}
          404:
            description: Release not found
            content:
              application/json:
                example: {'message': 'Release not found'}
        """
        data = _arg_parser_upload.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data['song_id']
        release_id = data['release_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(release_id):
            return {'message': 'Release ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_content_status(song_id) != 'complete':
            return {'message': 'Upload on storage not complete'}, HTTPStatus.BAD_REQUEST

        release = db.get_release(release_id)
        if release is None:
            return {'message': 'Release not found'}, HTTPStatus.NOT_FOUND
        if release.artist.get(c.ARTIST_REF_CREATOR) != user_id:
            return {'message': 'No authorized to upload this song'}, HTTPStatus.UNAUTHORIZED

        db.put_song(release_id, song_from_document({c.SONG_ID: song_id, c.SONG_TITLE: data['title']}), False)
        db.remove_content(song_id)

        td = NotificationWorker({'song_id': song_id, 'type': jobs.ANALYSIS}, amqp_client)
        td.start()

        if current_app.config['TRANSCODING_ON_UPLOAD']:
            td = NotificationWorker({'song_id': song_id, 'type': jobs.TRANSCODE}, amqp_client)
            td.start()

        return {'message': 'Upload completed'}, HTTPStatus.OK


@api.resource('/<song_id>')
class UpdateSong(Resource):
    method_decorators = [security.jwt_required]

    def patch(self, song_id):
        """Update a song
        ---
        tags: [metadata]
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

        patch_song = {}

        if title is not None:
            patch_song[c.SONG_TITLE] = title
        if lyrics is not None:
            patch_song[c.SONG_LYRICS] = lyrics

        if patch_song:
            db.update_song(song_id, patch_song)
        return None, HTTPStatus.NO_CONTENT

    def delete(self, song_id):
        """Delete a song
        ---
        tags: [metadata]
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
        delete_song(song)

        return None, HTTPStatus.NO_CONTENT
