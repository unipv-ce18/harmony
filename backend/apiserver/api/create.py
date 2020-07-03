import os
from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.contracts import artist_contract as c
from common.database.codecs import artist_from_document


api = Api(api_blueprint)

_arg_parser_artist = RequestParser()\
    .add_argument('name', required=True)\
    .add_argument('country')\
    .add_argument('life_span')\
    .add_argument('genres')\
    .add_argument('bio')\
    .add_argument('members')\
    .add_argument('links')


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
                example: {'message': 'Artist created'}
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

        return {'artist_id': artist_id}, HTTPStatus.OK
