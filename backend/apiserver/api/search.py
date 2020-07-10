from http import HTTPStatus

from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser
from fuzzywuzzy import fuzz

from . import api_blueprint, db
from ._conversions import create_artist_result, create_release_result, create_song_result, create_playlist_result
from ..util import security

api = Api(api_blueprint)

_arg_parser_search = RequestParser()\
    .add_argument('q', required=True)\
    .add_argument('t')\
    .add_argument('s', type=int)\
    .add_argument('c', type=int)


_SEARCH_FIELDS_ARTIST = ['id', 'name', 'image']
_SEARCH_FIELDS_RELEASE = ['id', 'name', 'artist', 'cover']
_SEARCH_FIELDS_SONG = ['id', 'title', 'artist', 'release']
_SEARCH_FIELDS_PLAYLIST = ['id', 'name', 'creator', 'images']


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
            result['artists'] = sort_by_weights(list(map(_to_artist_search_entry,
                                                         db.search_artist(query, start, count))), query, 'name')
        if search_type in ['any', 'releases']:
            result['releases'] = sort_by_weights(list(map(_to_release_search_entry,
                                                          db.search_release(query, start, count))), query, 'name')
        if search_type in ['any', 'songs']:
            result['songs'] = sort_by_weights(list(map(_to_song_search_entry,
                                                       db.search_song(query, start, count))), query, 'title')
        if search_type in ['any', 'playlists']:
            result['playlists'] = sort_by_weights(list(map(_to_playlist_search_entry,
                                                           db.search_playlist(query, start, count))), query, 'name')

        if not result:
            return {'message': f'Unknown search type: "{search_type}"'}, HTTPStatus.BAD_REQUEST

        return result, HTTPStatus.OK


def _to_artist_search_entry(artist):
    return {k: v for k, v in create_artist_result(artist).items() if k in _SEARCH_FIELDS_ARTIST}


def _to_playlist_search_entry(playlist):
    return {k: v for k, v in create_playlist_result(playlist).items() if k in _SEARCH_FIELDS_PLAYLIST}


def _to_release_search_entry(release):
    return {k: v for k, v in create_release_result(release).items() if k in _SEARCH_FIELDS_RELEASE}


def _to_song_search_entry(song):
    return {k: v for k, v in create_song_result(song).items() if k in _SEARCH_FIELDS_SONG}


def sort_by_weights(results, query: str, key: str):
    sorted_arr = []
    for result in results:
        ratio = fuzz.ratio(query.lower(), result[key].lower())
        partial_ratio = fuzz.partial_ratio(query.lower(), result[key].lower())
        weighted_avg = round(0.75*ratio + 0.25*partial_ratio, 2)
        result['weight'] = weighted_avg
        sorted_arr.append(result)
    return sorted(sorted_arr, key=lambda obj: obj['weight'], reverse=True)
