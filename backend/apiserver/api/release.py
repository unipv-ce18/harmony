from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from ._conversions import create_release_result
from common.database.contracts import artist_contract as c
from common.database.codecs import release_from_document


api = Api(api_blueprint, prefix='/release')

_arg_parser_create = RequestParser()\
    .add_argument('artist_id', required=True)\
    .add_argument('name', required=True)\
    .add_argument('date')\
    .add_argument('type')


_arg_parser_get = RequestParser()\
    .add_argument('songs')

_arg_parser_patch = RequestParser()\
    .add_argument('name')\
    .add_argument('date')\
    .add_argument('type')


@api.resource('')
class CreateRelease(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Create a release
        ---
        tags: [metadata]
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
        data = _arg_parser_create.parse_args()

        user_id = security.get_jwt_identity()
        artist_id = data['artist_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(artist_id):
            return {'message': 'Artist ID not valid'}, HTTPStatus.BAD_REQUEST

        artist = db.get_artist(artist_id)

        if artist is None:
            return {'message': 'No valid artist'}, HTTPStatus.BAD_REQUEST

        if artist.creator != user_id:
            return {'message': 'You are not authorized'}, HTTPStatus.UNAUTHORIZED

        release_id = db.put_release(artist_id, release_from_document(data))

        return {'release_id': release_id}, HTTPStatus.CREATED


@api.resource('/<release_id>')
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

        data = _arg_parser_get.parse_args()
        include_songs = data['songs'] in ['1', 'true', 'yes']
        release = db.get_release(release_id, include_songs)

        if release is None:
            return {'message': 'Release not found'}, HTTPStatus.NOT_FOUND
        return create_release_result(release), HTTPStatus.OK


@api.resource('/<release_id>')
class UpdateRelease(Resource):
    method_decorators = [security.jwt_required]

    def patch(self, release_id):
        """Update a release
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: release_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the release to update
        requestBody:
          description: Update the release
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  name: {type: string, description: The release name}
                  date: {type: string, description: The release date}
                  type: {type: string, description: The release type}
              examples:
                0: {summary: 'Update the release', value: {'name': 'NAME', 'date': 'AAAA-MM-DD', 'type': 'ALBUM'}}
        responses:
          204:  # No Content
            description: Release modified correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to modify this release
            content:
              application/json:
                example: {'message': 'No authorized to modify this release'}
          404:
            description: Release not found
            content:
              application/json:
                example: {'message': 'Release not found'}
        """
        data = _arg_parser_patch.parse_args()

        user_id = security.get_jwt_identity()
        name = data['name']
        date = data['date']
        type = data['type']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(release_id):
            return {'message': 'Release ID not valid'}, HTTPStatus.BAD_REQUEST

        release = db.get_release(release_id)
        if release is None:
            return {'message': 'Release not found'}, HTTPStatus.NOT_FOUND
        if release.artist.get(c.ARTIST_REF_CREATOR) != user_id:
            return {'message': 'No authorized to modify this release'}, HTTPStatus.UNAUTHORIZED

        if name is not None:
            db.change_name_release(release_id, name)
        if date is not None:
            db.change_date_release(release_id, date)
        if type is not None:
            db.change_type_release(release_id, type)

        return None, HTTPStatus.NO_CONTENT

    def delete(self, release_id):
        """Delete a release
        ---
        tags: [metadata]
        parameters:
          - in: path
            name: release_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the release to delete
        responses:
          204:  # No Content
            description: Release deleted correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to remove this release
            content:
              application/json:
                example: {'message': 'No authorized to remove this release'}
          404:
            description: Release not found
            content:
              application/json:
                example: {'message': 'Release not found'}
        """
        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(release_id):
            return {'message': 'Release ID not valid'}, HTTPStatus.BAD_REQUEST

        release = db.get_release(release_id, True)
        if release is None:
            return {'message': 'Release not found'}, HTTPStatus.NOT_FOUND
        if release.artist.get(c.ARTIST_REF_CREATOR) != user_id:
            return {'message': 'No authorized to remove this release'}, HTTPStatus.UNAUTHORIZED

        db.remove_release(release_id)
        db.remove_release_from_libraries(release_id)

        if release.cover is not None:
            db.remove_image_from_playlists(release.cover)
            db.put_content(None, None, 'image/_', release.cover)

        if release.songs:
            for song in release.songs:
                db.remove_song_from_playlists(song.id)
                db.remove_song_from_libraries(song.id)
                db.put_content(None, None, 'audio/flac', song.id)

        return None, HTTPStatus.NO_CONTENT
