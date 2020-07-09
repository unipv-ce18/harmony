from http import HTTPStatus

from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ._conversions import create_artist_result, create_release_result, create_song_result
from ..util import security


api = Api(api_blueprint)

_arg_parser_search = RequestParser()\
    .add_argument('q', required=True)\
    .add_argument('t')\
    .add_argument('s', type=int)\
    .add_argument('c', type=int)


_SEARCH_FIELDS_ARTIST = ['id', 'name', 'image', 'genres']
_SEARCH_FIELDS_RELEASE = ['id', 'name', 'artist', 'cover']
_SEARCH_FIELDS_SONG = ['id', 'title', 'artist', 'release']


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
        def _check_input(x): return x is not None and x > 0

        data = _arg_parser_search.parse_args()

        query = data['q']
        search_type = data['t'] or 'any'
        start = data['s'] if _check_input(data['s']) else 0
        count = data['c'] if _check_input(data['c']) else 50

        result = {}
        if search_type in ['any', 'artists']:
            result['artists'] = list(map(_to_artist_search_entry, db.search_artist(query, start, count)))
        if search_type in ['any', 'releases']:
            result['releases'] = list(map(_to_release_search_entry, db.search_release(query, start, count)))
        if search_type in ['any', 'songs']:
            result['songs'] = list(map(_to_song_search_entry, db.search_song(query, start, count)))
        if search_type in ['any', 'playlists']:
            result['playlists'] = list(map(lambda r: r.to_dict(), db.search_playlist(query, start, count)))

        if len(result) == 0:
            return {'message': f'Unknown search type: "{search_type}"'}, HTTPStatus.BAD_REQUEST

        return result, HTTPStatus.OK


def _to_artist_search_entry(artist):
    return {k: v for k, v in create_artist_result(artist).items() if k in _SEARCH_FIELDS_ARTIST}


def _to_release_search_entry(release):
    return {k: v for k, v in create_release_result(release).items() if k in _SEARCH_FIELDS_RELEASE}


def _to_song_search_entry(song):
    return {k: v for k, v in create_song_result(song).items() if k in _SEARCH_FIELDS_SONG}
