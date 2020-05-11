from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db


api = Api(api_blueprint)

_arg_parser_prefs = RequestParser()\
    .add_argument('user_id', required=True)\
    .add_argument('media_type', required=True)\
    .add_argument('media_id', required=True)


@api.resource('/preferences')
class Preferences(Resource):
    def post(self):
        data = _arg_parser_prefs.parse_args()

        user_id = data['user_id']
        media_type = data['media_type']
        media_id = data['media_id']

        if not ObjectId.is_valid(user_id) or not ObjectId.is_valid(media_id):
            return 'Id not valid', HTTPStatus.BAD_REQUEST

        response = db.update_prefs_library(user_id, media_type, media_id)

        if response:
            return {'message': 'Updated preferences'}, HTTPStatus.OK
        return {'message': 'No update'}, HTTPStatus.BAD_REQUEST


@api.resource('/library/<user_id>')
class Library(Resource):
    def get(self, user_id):
        if not ObjectId.is_valid(user_id):
            return 'Id not valid', HTTPStatus.BAD_REQUEST

        library = db.get_library(user_id)

        if library is None:
            return {'message': 'No library'}, HTTPStatus.NOT_FOUND

        if 'artists' in library:
            artists = [db.get_artist(id).to_dict() for id in library['artists']]
            library['artists'] = artists
        if 'releases' in library:
            releases = [db.get_release(id).to_dict() for id in library['releases']]
            library['releases'] = releases
        if 'songs' in library:
            songs = [db.get_song(id).to_dict() for id in library['songs']]
            library['songs'] = songs

        return library, HTTPStatus.OK
