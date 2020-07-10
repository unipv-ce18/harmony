from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint, prefix='/user')

_arg_parser_patch_bio = RequestParser()\
    .add_argument('bio', required=True)


@api.resource('/<user_id>')
class GetUser(Resource):
    method_decorators = [security.jwt_required]

    def get(self, user_id):
        """Retrieve a user
        ---
        tags: [user]
        parameters:
          - in: path
            name: user_id
            schema:
              type: string
            required: true
            description: The ID of the user or `me` for the currently logged in user
            example: me
        responses:
          200:
            description: Successful user retrieve
            content:
              application/json:
                example: {

                }
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
        """
        if user_id == 'me':
            user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        user = db.get_user(user_id)

        if user is None:
            return {'message': 'User not found'}, HTTPStatus.NOT_FOUND
        return user.to_dict(), HTTPStatus.OK


@api.resource('/playlist')
class CreatorPlaylist(Resource):
    method_decorators = [security.jwt_required]

    def get(self):
        """Retrieve personal playlists
        ---
        tags: [user]
        responses:
          200:
            description: Successful playlists retrieve
            content:
              application/json:
                example: {

                }
          400:
            description: User ID not valid
            content:
              application/json:
                example: {'message': 'User ID not valid'}
        """
        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        playlists = db.get_creator_playlists(user_id)
        library = db.get_library(user_id).to_dict()

        if playlists:
            playlists = [playlist.to_dict() for playlist in playlists]
            if library[uc.LIBRARY_PLAYLISTS] is not None:
                return [playlist for playlist in playlists if playlist[c.PLAYLIST_REF_ID] in library[uc.LIBRARY_PLAYLISTS]], HTTPStatus.OK
        return [], HTTPStatus.OK


@api.resource('/bio')
class UpdateUserBio(Resource):
    method_decorators = [security.jwt_required]

    def patch(self):
        """Update a user bio
        ---
        tags: [user]
        requestBody:
          description: Modify the bio
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  bio: {type: string, description: The user bio}
                required: [bio]
              examples:
                0: {summary: 'Modify bio', value: {'bio': 'BIO'}}
        responses:
          204:  # No Content
            description: Bio modified correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
        """
        data = _arg_parser_patch_bio.parse_args()

        user_id = security.get_jwt_identity()
        bio = data['bio']

        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.update_user_bio(user_id, bio):
            return None, HTTPStatus.NO_CONTENT
        return {'message': 'User not found'}, HTTPStatus.NOT_FOUND
