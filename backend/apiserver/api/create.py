import os
from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.contracts import artist_contract as c
from common.database.codecs import artist_from_document, release_from_document


api = Api(api_blueprint)

_arg_parser_artist = RequestParser()\
    .add_argument('name', required=True)\
    .add_argument('country')\
    .add_argument('life_span')\
    .add_argument('genres')\
    .add_argument('bio')\
    .add_argument('members')\
    .add_argument('links')

_arg_parser_release = RequestParser()\
    .add_argument('artist_id', required=True)\
    .add_argument('name', required=True)\
    .add_argument('date')\
    .add_argument('type')


@api.resource('/createArtist')
class CreateArtist(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Create an artist
        ---
        tags: [misc]
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
        data = _arg_parser_artist.parse_args()

        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_user_type(user_id) != 'creator':
            return {'message': 'You are not a creator'}, HTTPStatus.UNAUTHORIZED

        data['creator'] = user_id
        artist_id = db.put_artist(artist_from_document(data))

        return {'artist_id': artist_id}, HTTPStatus.CREATED


@api.resource('/createRelease')
class CreateRelease(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Create a release
        ---
        tags: [misc]
        requestBody:
          description: Release to create
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  artist_id: {type: string, description: ID of the artist where the release will be created}
                  name: {type: string, description: Name of the release}
                  date: {type: string, description: Date of the release (AAAA or AAAA-MM-DD)}
                  type: {type: strng, description: Type of the release (album, live, ...)}
                required: [artist_id, name]
              examples:
                0: {summary: 'Release', value: {'artist_id': 'ARTIST_ID', 'name': 'NAME', 'date': 'AAAA-MM-DD', 'type': 'TYPE'}}
        responses:
          201:
            description: Release created
            content:
              application/json:
                example: {'release_id': 'RELEASE_ID'}
          400:
            description: ID not valid
            content:
              application/json:
                example: {'message': 'ID not valid'}
          401:
            description: The user logged in is not authorized to upload the release for this artist
            content:
              application/json:
                example: {'message': 'You are not authorized'}
        """
        data = _arg_parser_release.parse_args()

        user_id = security.get_jwt_identity()
        artist_id = data['artist_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(artist_id):
            return {'message': 'Artist ID not valid'}, HTTPStatus.BAD_REQUEST

        artist = db.get_artist(artist_id)

        if artist is None:
            return {'message': 'No valid artist'}, HTTPStatus.BAD_REQUEST

        if artist.to_dict().get(c.ARTIST_CREATOR) != user_id:
            return {'message': 'You are not authorized'}, HTTPStatus.UNAUTHORIZED

        release_id = db.put_release(artist_id, release_from_document(data))

        return {'release_id': release_id}, HTTPStatus.CREATED
