from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api

from . import api_blueprint, db
from ..util import security


api = Api(api_blueprint, prefix='/user')


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
