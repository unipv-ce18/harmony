from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint)


@api.resource('/artist/<artist_id>')
class UpdateArtist(Resource):
    method_decorators = [security.jwt_required]

    def delete(self, artist_id):
        """Delete an artist
        ---
        tags: [misc]
        parameters:
          - in: path
            name: artist_id
            schema:
              $ref: '#components/schemas/ObjectId'
            required: true
            description: ID of the artist to delete
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
        user_id = security.get_jwt_identity()

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
