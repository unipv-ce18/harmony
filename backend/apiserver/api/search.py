from http import HTTPStatus

from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint)

_arg_parser_search = RequestParser()\
    .add_argument('q', required=True)\
    .add_argument('t')\
    .add_argument('s', type=int)\
    .add_argument('c', type=int)


@api.resource('/search')
class Search(Resource):
    method_decorators = [security.jwt_required]

    def get(self):
        """Search inside Harmony
        ---
        tags: [misc]
        parameters:
          - in: query
            name: q
            schema:
              type: string
            required: true
            description: The search query
            example: Maximum Sexy Pigeon
          - in: query
            name: t
            schema:
              type: string
              enum: ['any', 'artists', 'releases', 'songs', 'playlists']
            required: false
            description: Type of search
          - in: query
            name: s
            schema:
              type: int
            required: false
            description: Start index of the results
          - in: query
            name: c
            schema:
              type: int
            required: false
            description: Number of the results to return per category
        responses:
          200:
            description: Successful search for `any`, no results
            content:
              application/json:
                example: {
                  "artists": [],
                  "releases": [],
                  "songs": [],
                  "playlists": []
                }
          400:
            description: Unrecognized search type argument
            content:
              application/json:
                example: {"message": 'Unknown search type: "foobar"'}
        """
        _check_input = lambda x: x is not None and x > 0
        _convert_result = lambda res: [r.to_dict() for r in res]

        data = _arg_parser_search.parse_args()

        query = data['q']
        search_type = data['t'] or 'any'
        start = data['s'] if _check_input(data['s']) else 0
        count = data['c'] if _check_input(data['c']) else 50

        result = {}
        if search_type in ['any', 'artists']:
            result['artists'] = _convert_result(db.search_artist(query, start, count))
        if search_type in ['any', 'releases']:
            result['releases'] = _convert_result(db.search_release(query, start, count))
        if search_type in ['any', 'songs']:
            result['songs'] = _convert_result(db.search_song(query, start, count))
        if search_type in ['any', 'playlists']:
            result['playlists'] = _convert_result(db.search_playlist(query, start, count))

        if len(result) == 0:
            return {'message': f'Unknown search type: "{search_type}"'}, HTTPStatus.BAD_REQUEST

        return result, HTTPStatus.OK
