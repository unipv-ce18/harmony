from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api
from flask_restful.reqparse import RequestParser

from . import api_blueprint, db
from ..util import security
from ._conversions import create_artist_result, _get_image_url
from ._deletion import delete_user
from common.database.contracts import user_contract as uc
from common.database.contracts import playlist_contract as c


api = Api(api_blueprint, prefix='/user')

_arg_parser_get = RequestParser()\
    .add_argument('artists')

_arg_parser_patch = RequestParser()\
    .add_argument('new_password')\
    .add_argument('current_password')\
    .add_argument('bio')\
    .add_argument('prefs', type=dict)
# eheh

@api.resource('/<user_id>')
class UserOptions(Resource):
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
          - in: query
            name: artists
            schema:
              type: boolean
            required: false
            description: Whenever to include artists references in the returned user
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
        user = user.to_dict()
        user['avatar_url'] = _get_image_url(user['avatar_url']) if user.get('avatar_url') is not None else None

        if user[uc.USER_PREFS]['private']['email'] and user_id != security.get_jwt_identity():
            user[uc.USER_EMAIL] = None

        data = _arg_parser_get.parse_args()
        include_artists = data['artists'] in ['1', 'true', 'yes']

        if include_artists and db.get_user_type(user_id) == uc.USER_TYPE_CREATOR:
            user['artists'] = [create_artist_result(artist) for artist in db.get_user_artists(user_id)]

        return user, HTTPStatus.OK

    def patch(self, user_id):
        """Update a user
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
        requestBody:
          description: Modify the user
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  new_password: {type: string, description: The user new password}
                  current_password: {type: string, description: The user current password}
                  bio: {type: string, description: The user bio}
                  prefs: {type: dict, description: The user preferencies}
              examples:
                0: {summary: 'Modify user info', value: {'new_password': 'NEW_PWD', 'current_password': 'OLD_PWD', 'bio': 'BIO', 'prefs': {'private': {'email': true}}}}
        responses:
          204:  # No Content
            description: User info modified correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to modify this user info
            content:
              application/json:
                example: {'message': 'No authorized to modify this user'}
          404:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
        """
        data = _arg_parser_patch.parse_args()

        if user_id == 'me':
            user_id = security.get_jwt_identity()

        if user_id != security.get_jwt_identity():
            return {'message': 'No authorized to modify this user'}, HTTPStatus.UNAUTHORIZED

        new_password = data['new_password']
        current_password = data['current_password']
        bio = data['bio']
        prefs = data['prefs']

        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        patch_user = {}

        if new_password is not None:
            if current_password is None:
                return {'message': 'You have to provide your current password'}, HTTPStatus.BAD_REQUEST

            user_password = db.get_user_password(user_id)
            if not security.verify_password(user_password, current_password):
                return {'message': 'Wrong password'}, HTTPStatus.BAD_REQUEST

            patch_user[uc.USER_PASSWORD] = security.hash_password(new_password)
        if bio is not None:
            patch_user[uc.USER_BIO] = bio
        if prefs is not None:
            if isinstance(prefs['private']['email'], bool):
                patch_user[uc.USER_PREFS] = prefs

        if patch_user:
            if db.update_user(user_id, patch_user):
                return None, HTTPStatus.NO_CONTENT
        return {'message': 'User not found'}, HTTPStatus.NOT_FOUND

    def delete(self, user_id):
        """Delete a user
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
          204:  # No Content
            description: User deleted correctly
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          401:
            description: The user logged in is not authorized to delete this user
            content:
              application/json:
                example: {'message': 'No authorized to delete this user'}
          404:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
        """

        if user_id == 'me':
            user_id = security.get_jwt_identity()

        if user_id != security.get_jwt_identity():
            return {'message': 'No authorized to delete this user'}, HTTPStatus.UNAUTHORIZED

        if not ObjectId.is_valid(user_id):
            return {'message': 'ID not valid'}, HTTPStatus.BAD_REQUEST

        user = db.get_user(user_id)
        if user is None:
            return {'message': 'User not found'}, HTTPStatus.NOT_FOUND

        delete_user(user)
        db.remove_user(user_id)

        return None, HTTPStatus.NO_CONTENT


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
