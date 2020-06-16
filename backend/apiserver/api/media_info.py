from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security

api = Api(api_blueprint)

_arg_parser_release = RequestParser().add_argument('songs')
_arg_parser_artist = RequestParser().add_argument('releases')


@api.resource('/release/<release_id>')
class GetRelease(Resource):
    method_decorators = [security.jwt_required]

    def get(self, release_id):
        """Retrieve a release
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: release_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the release to fetch
          - in: query
            name: songs
            schema:
              type: boolean
            required: false
            description: Whenever to include song references inside the release
        responses:
          200:
            description: Successful release retrieve
            content:
              application/json:
                schema:
                  $ref: '#components/schemas/Release'
                example: {
                  'id': 'RELEASE ID',
                  'name': 'RELEASE NAME',
                  'date': 'RELEASE YEAR',
                  'artist': {
                    'id': 'ARTIST ID',
                    'name': 'ARTIST NAME'
                  },
                  'type': 'RELEASE TYPE',
                  'cover': 'IMAGE URL',
                  'songs': ['RELEASE SONGS']
                }
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: Release not found
            content:
              application/json:
                example: {'message': 'Release not found'}
        """
        if not ObjectId.is_valid(release_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        args = _arg_parser_release.parse_args()
        include_songs = args['songs'] in ['1', 'true', 'yes']
        release = db.get_release(release_id, include_songs)

        if release is None:
            return {'message': 'Release not found'}, HTTPStatus.NOT_FOUND
        return release.to_dict(), HTTPStatus.OK


@api.resource('/artist/<artist_id>')
class GetArtist(Resource):
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

        data = _arg_parser_artist.parse_args()
        include_releases = data['releases'] in ['1', 'true', 'yes']
        artist = db.get_artist(artist_id, include_releases)

        if artist is None:
            return {'message': 'No artist'}, HTTPStatus.NOT_FOUND
        return artist.to_dict(), HTTPStatus.OK


@api.resource('/playlist/<playlist_id>')
class GetPlaylist(Resource):
    method_decorators = [security.jwt_required]

    def get(self, playlist_id):
        """Retrieve a playlist
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: playlist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the playlist to fetch
        responses:
          200:
            description: Successful playlist retrieve
            content:
              application/json:
                example: {
                  'id': 'PLAYLIST ID',
                  'name': 'PLAYLIST NAME',
                  'creator': {
                    'id': 'PLAYLIST_CREATOR_ID',
                    'username': 'PLAYLIST_CREATOR_USERNAME'
                  },
                  'songs': ['PLAYLIST SONGS']
                }
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: Playlist not found
            content:
              application/json:
                example: {'message': 'Playlist not found'}
        """
        if not ObjectId.is_valid(playlist_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        playlist = db.get_playlist(playlist_id)

        if playlist is None:
            return {'message': 'Playlist not found'}, HTTPStatus.NOT_FOUND

        playlist = playlist.to_dict()
        playlist['songs'] = [db.get_song_for_library(song_id).to_dict() for song_id in playlist['songs']]

        return playlist, HTTPStatus.OK
