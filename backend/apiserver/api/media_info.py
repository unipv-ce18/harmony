from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db


api = Api(api_blueprint)

_arg_parser_release = RequestParser().add_argument('songs')
_arg_parser_artist = RequestParser().add_argument('releases')


@api.resource('/release/<id>')
class GetRelease(Resource):
    def get(self, release_id):
        if not ObjectId.is_valid(release_id):
            return 'Id not valid', 401

        args = _arg_parser_release.parse_args()
        include_songs = args['songs'] == '1'
        release = db.get_release(release_id, include_songs)

        if release is None:
            return 'No release', 401
        return release.to_dict(), 200


@api.resource('/artist/<id>')
class GetArtist(Resource):
    def get(self, artist_id):
        if not ObjectId.is_valid(artist_id):
            return 'Id not valid', 401

        data = _arg_parser_artist.parse_args()
        include_releases = data['releases'] == '1'
        artist = db.get_artist(artist_id, include_releases)

        if artist is None:
            return 'No artist', 401
        return artist.to_dict(), 200
