from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db


api = Api(api_blueprint)

_arg_parser_release = RequestParser().add_argument('songs')
_arg_parser_artist = RequestParser().add_argument('releases')


@api.resource('/release/<release_id>')
class GetRelease(Resource):
    def get(self, release_id):
        """Retrieve a release
        ---
        tags: [metadata]
        security: []
        parameters:
          - in: path
            name: release_id
            type: string
            required: true
        responses:
          200:
            description: Successful release retrieve
            content:
              application/json:
                example: {
                  'id': 'RELEASE ID',
                  'name': 'RELEASE NAME',
                  'date': 'RELEASE YEAR',
                  'artist': {
                    'id': 'ARTIST ID',
                    'name': 'ARTIST NAME'
                  },
                  'type': 'RELEASE TYPE',
                  'cover': 'IMAGE URL',
                  'songs': ['RELEASE SONGS']
                }
          400:
            description: Release id not valid
            content:
              application/json:
                example: {'message': 'Id not valid'}
          404:
            description: Release not found
            content:
              application/json:
                example: {'message': 'No release'}
        """
        if not ObjectId.is_valid(release_id):
            return {'message': 'Id not valid'}, HTTPStatus.BAD_REQUEST

        args = _arg_parser_release.parse_args()
        include_songs = args['songs'] == '1'
        release = db.get_release(release_id, include_songs)

        if release is None:
            return {'message': 'No release'}, HTTPStatus.NOT_FOUND
        return release.to_dict(), HTTPStatus.OK


@api.resource('/artist/<artist_id>')
class GetArtist(Resource):
    def get(self, artist_id):
        """Retrieve an artist
        ---
        tags: [metadata]
        security: []
        parameters:
          - in: path
            name: artist_id
            type: string
            required: true
        responses:
          200:
            description: Successful artist retrieve
            content:
              application/json:
                example: {
                  'id': 'ARTIST ID',
                  'name': 'ARTIST NAME',
                  'sort_name': 'ARTIST SORTED NAME',
                  'country': 'ARTIST COUNTRY',
                  'life_span': {
                    'begin': 'CAREER START YEAR',
                    'end': 'CAREER END YEAR'
                  },
                  'genres': ['GENRES'],
                  'bio': 'ARTIST BIO',
                  'members': ['MEMBERS'],
                  'links': {
                    'website': 'WEBSITE',
                    'facebook': 'FACEBOOK URL',
                    'twitter': 'TWITTER URL',
                    'instagram': 'INSTAGRAM URL'
                  },
                  'image': 'IMAGE URL',
                  'releases': ['ARTIST RELEASES']
                }
          400:
            description: Artist id not valid
            content:
              application/json:
                example: {'message': 'Id not valid'}
          404:
            description: Artist not found
            content:
              application/json:
                example: {'message': 'No artist'}
        """
        if not ObjectId.is_valid(artist_id):
            return {'message': 'Id not valid'}, HTTPStatus.BAD_REQUEST

        data = _arg_parser_artist.parse_args()
        include_releases = data['releases'] == '1'
        artist = db.get_artist(artist_id, include_releases)

        if artist is None:
            return {'message': 'No artist'}, HTTPStatus.NOT_FOUND
        return artist.to_dict(), HTTPStatus.OK
