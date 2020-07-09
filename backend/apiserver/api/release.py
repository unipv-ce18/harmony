from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from common.database.contracts import artist_contract as c


api = Api(api_blueprint)

_arg_parser_patch = RequestParser()\
    .add_argument('name')\
    .add_argument('date')\
    .add_argument('type')


@api.resource('/release/<release_id>')
class UpdateRelease(Resource):
    method_decorators = [security.jwt_required]

    def patch(self, release_id):
        """Update release data
        ---
        tags: [misc]
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
        tags: [misc]
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
