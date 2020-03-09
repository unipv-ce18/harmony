from flask_restful import Resource, reqparse


searchparser = reqparse.RequestParser()
searchparser.add_argument('t')
searchparser.add_argument('s', type=int)
searchparser.add_argument('c', type=int)


class Search(Resource):
    def __init__(self, db):
        self.db = db

    def get(self, query):
        data = searchparser.parse_args()
        type = data['t'] if data['t'] is not None else 'any'
        start = data['s'] if data['s'] is not None else 0
        count = data['c'] if data['c'] is not None else 50

        result = {
            'any': {
                'artists': self.db.search_artist(query, start, count),
                'releases': self.db.search_release(query, start, count),
                'songs': self.db.search_song(query, start, count)
            },
            'artists': self.db.search_artist(query, start, count),
            'releases': self.db.search_release(query, start, count),
            'songs': self.db.search_song(query, start, count)
        }.get(type)

        if isinstance(result, list):
            if result:
                return [res.to_dict() for res in result], 200
            else:
                return 'Nothing found', 401
        if isinstance(result, dict):
            for k in result:
                if result[k]:
                    result[k] = [res.to_dict() for res in result[k]]
            if not all(v == [] for v in result.values()):
                return result, 200
            else:
                return 'Nothing found', 401

        return 'Nothing found', 401
