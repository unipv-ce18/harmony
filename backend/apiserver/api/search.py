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
        """Search
        ---
        tags: [misc]
        parameters:
          - in: query
            name: q
            schema:
              type: string
            required: true
            description: query
            example: queens
          - in: query
            name: t
            schema:
              type: string
            required: false
            description: Type of search
          - in: query
            name: s
            schema:
              type: int
            required: false
            description: Start
          - in: query
            name: c
            schema:
              type: int
            required: false
            description: Count
        responses:
          200:
            description: Successful search
            content:
              application/json:
                example: {

                }
        """
        data = _arg_parser_search.parse_args()
        _check = lambda x : x is not None and x > 0

        query = data['q']
        type = data['t'] or 'any'
        start = data['s'] if _check(data['s']) else 0
        count = data['c'] if _check(data['c']) else 50

        result = {
            'any': {
                'artists': db.search_artist(query, start, count),
                'releases': db.search_release(query, start, count),
                'songs': db.search_song(query, start, count),
                'playlists': db.search_playlist(query, start, count)
            },
            'artists': db.search_artist(query, start, count),
            'releases': db.search_release(query, start, count),
            'songs': db.search_song(query, start, count),
            'playlists': db.search_playlist(query, start, count)
        }.get(type)

        if isinstance(result, list) and result:
            return [res.to_dict() for res in result], HTTPStatus.OK

        if isinstance(result, dict):
            for k in result:
                if result[k]:
                    result[k] = [res.to_dict() for res in result[k]]
            if not all(v == [] for v in result.values()):
                return result, HTTPStatus.OK

        return [], HTTPStatus.OK
