from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db

api = Api(api_blueprint)

_arg_parser_search = RequestParser()\
    .add_argument('t')\
    .add_argument('s', type=int)\
    .add_argument('c', type=int)


@api.resource('/search/<query>')
class Search(Resource):
    def get(self, query):
        data = _arg_parser_search.parse_args()
        type = data['t'] or 'any'
        start = data['s'] or 0
        count = data['c'] or 50

        result = {
            'any': {
                'artists': db.search_artist(query, start, count),
                'releases': db.search_release(query, start, count),
                'songs': db.search_song(query, start, count)
            },
            'artists': db.search_artist(query, start, count),
            'releases': db.search_release(query, start, count),
            'songs': db.search_song(query, start, count)
        }.get(type)

        if isinstance(result, list) and result:
            return [res.to_dict() for res in result], 200

        if isinstance(result, dict):
            for k in result:
                if result[k]:
                    result[k] = [res.to_dict() for res in result[k]]
            if not all(v == [] for v in result.values()):
                return result, 200

        return 'Nothing found', 401