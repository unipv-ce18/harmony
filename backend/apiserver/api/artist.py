from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from ._conversions import create_artist_result
from common.database.contracts import artist_contract as c
from common.database.codecs import artist_from_document


api = Api(api_blueprint, prefix='/artist')

_arg_parser_create = RequestParser()\
    .add_argument('name', required=True)\
    .add_argument('country')\
    .add_argument('life_span', type=dict)\
    .add_argument('genres', type=str, action='append')\
    .add_argument('bio')\
    .add_argument('members', type=dict, action='append')\
    .add_argument('links', type=dict)

_arg_parser_get = RequestParser()\
    .add_argument('releases')


@api.resource('')
class CreateArtist(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Create an artist
        ---
        tags: [metadata]
        requestBody:
          description: Artist to create
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  name: {type: string, description: Artist}
              examples:
                0: {summary: 'Artist', value: {'name': 'NAME', 'country': 'COUNTRY',
                                               'life_span': {'begin': 1994, 'end': None},
                                               'genres': ['bla', 'asd'], 'bio': 'eheh',
                                               'members': [{'name': 'io', 'role': 'piano'}, {'name': 'me', 'role': 'guitar'}],
                                               'links': {'website': 'www', 'instagram': 'www', 'facebook': 'www', 'twitter': 'www'}}
                   }
        responses:
          201:
            description: Artist created
            content:
              application/json:
                example: {'artist_id': 'ARTIST_ID'}
          400:
            description: ID not valid
            content:
              application/json:
                example: {'message': 'ID not valid'}
        """
        data = _arg_parser_create.parse_args()

        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_user_type(user_id) != 'creator':
            return {'message': 'You are not a creator'}, HTTPStatus.UNAUTHORIZED

        data[c.ARTIST_CREATOR] = user_id
        data[c.ARTIST_SORT_NAME] = data['name']

        artist_id = db.put_artist(artist_from_document(data))

        return {'artist_id': artist_id}, HTTPStatus.CREATED


@api.resource('/<artist_id>')
class ArtistOptions(Resource):
    method_decorators = [security.jwt_required]

    def get(self, artist_id):
        """Retrieve an artist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: artist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the artist to retrieve
          - in: query
            name: releases
            schema:
              type: boolean
            required: false
            description: Whenever to include release references in the returned artist
        responses:
          200:
            description: Successful artist retrieve
            content:
              application/json:
                schema:
                  $ref: '#components/schemas/Artist'
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
            $ref: '#components/responses/InvalidId'
          404:
            description: Artist not found
            content:
              application/json:
                example: {'message': 'No artist'}
        """
        if not ObjectId.is_valid(artist_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        data = _arg_parser_get.parse_args()
        include_releases = data['releases'] in ['1', 'true', 'yes']
        artist = db.get_artist(artist_id, include_releases)

        if artist is None:
            return {'message': 'No artist'}, HTTPStatus.NOT_FOUND
        return create_artist_result(artist), HTTPStatus.OK

    def delete(self, artist_id):
        """Delete an artist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: artist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the artist to delete
        responses:
          204:  # No Content
            description: Artist deleted correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to remove this artist
            content:
              application/json:
                example: {'message': 'No authorized to remove this artist'}
          404:
            description: Artist not found
            content:
              application/json:
                example: {'message': 'Artist not found'}
        """
        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(artist_id):
            return {'message': 'Artist ID not valid'}, HTTPStatus.BAD_REQUEST

        artist = db.get_artist(artist_id, True)
        if artist is None:
            return {'message': 'Artist not found'}, HTTPStatus.NOT_FOUND
        if artist.creator != user_id:
            return {'message': 'No authorized to remove this artist'}, HTTPStatus.UNAUTHORIZED

        db.remove_artist_from_libraries(artist_id)

        if artist.image is not None:
            db.put_content(None, None, 'image/_', artist.image)

        if artist.releases:
            for release in artist.releases:
                r = db.get_release(release.id, True)

                db.remove_release_from_libraries(release.id)

                if release.cover is not None:
                    db.remove_image_from_playlists(release.cover)
                    db.put_content(None, None, 'image/_', release.cover)

                if r.songs:
                    for song in r.songs:
                        db.remove_song_from_playlists(song.id)
                        db.remove_song_from_libraries(song.id)
                        db.put_content(None, None, 'audio/flac', song.id)

        db.remove_artist(artist_id)

        return None, HTTPStatus.NO_CONTENT
