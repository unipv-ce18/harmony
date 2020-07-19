from http import HTTPStatus

from bson import ObjectId
from flask import current_app
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db, transcoder_client
from ..ws.notification_worker import NotificationWorker
from ..util import security
from common.database.contracts import user_contract as c
from common.storage import get_storage_base_url
import common.messaging.jobs as jobs


api = Api(api_blueprint)

_arg_parser_pitch = RequestParser()\
    .add_argument('song_id', required=True)\
    .add_argument('semitones', type=float, required=True)\
    .add_argument('output_format', required=True)


@api.resource('/pitch')
class Pitch(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Change the pitch of a song
        ---
        tags: [misc]
        requestBody:
          description: Song metadata to upload
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  song_id: {type: string, description: Song ID}
                  semitones: {type: float, description: Semitones to shift the song}
                  output_format: {type: string, description: Song output format}
                required: [song_id, semitones, output_format]
              examples:
                0: {summary: 'Song', value: {'song_id': 'SONG_ID', 'semitones': 1, 'output_format': 'mp3'}}
        responses:
          200:
            description: Song changed the pitch successfully
            content:
              application/json:
                example: {'url': 'URL'}
          400:
            description: ID not valid
            content:
              application/json:
                example: {'message': 'ID not valid'}
          401:
            description: The user logged in is not authorized to request this content
            content:
              application/json:
                example: {'message': 'You are not a pro user'}
          404:
            description: Song not found
            content:
              application/json:
                example: {'message': 'Song not found'}
        """
        data = _arg_parser_pitch.parse_args()

        user_id = security.get_jwt_identity()
        song_id = data['song_id']
        semitones = data['semitones']
        output_format = data['output_format']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(song_id):
            return {'message': 'Song ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_user_tier(user_id) != c.USER_TIER_PRO:
            return {'message': 'You are not a pro user'}, HTTPStatus.UNAUTHORIZED

        song = db.get_song(song_id)
        if song is None:
            return {'message': 'Song not found'}, HTTPStatus.NOT_FOUND

        message = {
            'song_id': song_id,
            'semitones': semitones,
            'output_format': output_format,
            'type': jobs.CHANGE_PITCH
        }

        td = NotificationWorker(message, transcoder_client)
        td.start()
        td.join()

        return {'url': _get_pitch_song_url(song_id, semitones, output_format)}, HTTPStatus.OK


def _get_pitch_song_url(song_id, semitones, output_format):
    conf = current_app.config
    return get_storage_base_url(conf) + conf['STORAGE_BUCKET_PITCH'] + f'/{song_id}_{semitones}.{output_format}'
