from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint)

_arg_parser_delete = RequestParser()\
    .add_argument('artist_id', required=True)


@api.resource('/artist')
class UpdateArtist(Resource):
    method_decorators = [security.jwt_required]

    def delete(self):
        """Delete an artist
        ---
        tags: [misc]
        requestBody:
          description: Delete an artist
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  artist_id: {type: string, description: The artist id}
                required: [artist_id]
              examples:
                0: {summary: 'Delete an artist', value: {'artist_id': 'ARTIST_ID'}}
        responses:
          204:  # No Content
            description: Artist deleted correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to remove this artist
            content:
              application/json:
                example: {'message': 'No authorized to remove this artist'}
          404:
            description: Artist not found
            content:
              application/json:
                example: {'message': 'Artist not found'}
        """
        data = _arg_parser_delete.parse_args()

        user_id = security.get_jwt_identity()
        artist_id = data['artist_id']

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if not ObjectId.is_valid(artist_id):
            return {'message': 'Artist ID not valid'}, HTTPStatus.BAD_REQUEST

        artist = db.get_artist(artist_id, True)
        if artist is None:
            return {'message': 'Artist not found'}, HTTPStatus.NOT_FOUND
        if artist.creator != user_id:
            return {'message': 'No authorized to remove this artist'}, HTTPStatus.UNAUTHORIZED

        db.remove_artist_from_libraries(artist_id)

        if artist.image is not None:
            db.put_content(None, None, 'image/_', artist.image)

        if artist.releases:
            for release in artist.releases:
                r = db.get_release(release.id, True)

                db.remove_release_from_libraries(release.id)

                if release.cover is not None:
                    db.remove_image_from_playlists(release.cover)
                    db.put_content(None, None, 'image/_', release.cover)

                if r.songs:
                    for song in r.songs:
                        db.remove_song_from_playlists(song.id)
                        db.remove_song_from_libraries(song.id)
                        db.put_content(None, None, 'audio/flac', song.id)

        db.remove_artist(artist_id)

        return None, HTTPStatus.NO_CONTENT
