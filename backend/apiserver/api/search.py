from http import HTTPStatus

from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser
from fuzzywuzzy import fuzz

from . import api_blueprint, db
from ._conversions import create_artist_result, create_release_result, create_song_result, create_playlist_result
from ..util import security


api = Api(api_blueprint)

_arg_parser_search = RequestParser()\
    .add_argument('query', required=True)


_SEARCH_FIELDS_ARTIST = ['id', 'name', 'image', 'genres']
_SEARCH_FIELDS_RELEASE = ['id', 'name', 'artist', 'date', 'cover']
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
            name: query
            schema:
              type: string
            required: true
            description: The search query
            example: q:songs-only,genre=rock+alternative,beats=12
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
            description: Malformed search request
            content:
              application/json:
                example: {"message": 'Malformed search request'}
        """
        _check_restriction = lambda check, params : any(check in p for p in params)
        _check_input = lambda check, params : ''.join([p for p in params if check in p]).replace(f'{check}=', '')
        _create_result = lambda entry, result, query, key : sort_by_weights(list(map(entry, result)), query, key)

        data = _arg_parser_search.parse_args()

        query = data['query'].split(':')

        search_text = query[0]
        start = 0
        count = 50

        result = {}

        if len(query) > 1:
            params = query[1].split(',')

            genres = _check_input('genre', params)
            genres = genres.replace('+', ' ') if genres else None

            bpm = _check_input('beats', params)
            try:
                bpm = int(bpm) if bpm else None

                if bpm and not _check_restriction('artists-only', params) \
                    and not _check_restriction('releases-only', params) and not _check_restriction('playlists-only', params):
                    result['songs'] = _create_result(_to_song_search_entry, db.search_song(search_text, start, count, genres, bpm), search_text, 'title')
                    return result, HTTPStatus.OK

                if bpm and not _check_restriction('songs-only', params):
                    return {'message': 'Malformed search request'}, HTTPStatus.BAD_REQUEST

                if _check_restriction('artists-only', params):
                    result['artists'] = _create_result(_to_artist_search_entry, db.search_artist(search_text, start, count, genres), search_text, 'name')
                elif _check_restriction('releases-only', params):
                    result['releases'] = _create_result(_to_release_search_entry, db.search_release(search_text, start, count, genres), search_text, 'name')
                elif _check_restriction('songs-only', params):
                    result['songs'] = _create_result(_to_song_search_entry, db.search_song(search_text, start, count, genres, bpm), search_text, 'title')
                elif _check_restriction('playlists-only', params):
                    result['playlists'] = _create_result(_to_playlist_search_entry, db.search_playlist(search_text, start, count), search_text, 'name')
                else:
                    result['artists'] = _create_result(_to_artist_search_entry, db.search_artist(search_text, start, count, genres), search_text, 'name')
                    result['releases'] = _create_result(_to_release_search_entry, db.search_release(search_text, start, count, genres), search_text, 'name')
                    result['songs'] = _create_result(_to_song_search_entry, db.search_song(search_text, start, count, genres, bpm), search_text, 'title')
                    result['playlists'] = _create_result(_to_playlist_search_entry, db.search_playlist(search_text, start, count), search_text, 'name')
            except:
                pass
        else:
            result['artists'] = _create_result(_to_artist_search_entry, db.search_artist(search_text, start, count), search_text, 'name')
            result['releases'] = _create_result(_to_release_search_entry, db.search_release(search_text, start, count), search_text, 'name')
            result['songs'] = _create_result(_to_song_search_entry, db.search_song(search_text, start, count), search_text, 'title')
            result['playlists'] = _create_result(_to_playlist_search_entry, db.search_playlist(search_text, start, count), search_text, 'name')

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
