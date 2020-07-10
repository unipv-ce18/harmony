from http import HTTPStatus

from bson import ObjectId
from flask_restful import Resource, Api

from . import api_blueprint, db
from ..util import security
from common.database.contracts import user_contract as c


api = Api(api_blueprint, prefix='/user')


@api.resource('/type')
class UpgradeType(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Upgrade to creator user
        ---
        tags: [user]
        responses:
          204:  # No Content
            description: I am a creator now
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
          409:
            description: User already creator
            content:
              application/json:
                example: {'message': 'You are already a creator'}
        """
        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_user_type(user_id) == c.USER_TYPE_CREATOR:
            return {'message': 'You are already a creator'}, HTTPStatus.CONFLICT

        response = db.upgrade_creator(user_id)

        if response:
            return None, HTTPStatus.NO_CONTENT
        return {'message': 'User not found'}, HTTPStatus.NOT_FOUND


@api.resource('/tier')
class UpgradeTier(Resource):
    method_decorators = [security.jwt_required]

    def post(self):
        """Upgrade to pro user
        ---
        tags: [user]
        responses:
          204:  # No Content
            description: I am a pro now
            content: {}
          400:
            $ref: '#components/responses/InvalidId'
          404:
            description: User not found
            content:
              application/json:
                example: {'message': 'User not found'}
          409:
            description: User already pro
            content:
              application/json:
                example: {'message': 'You are already pro'}
        """
        user_id = security.get_jwt_identity()

        if not ObjectId.is_valid(user_id):
            return {'message': 'User ID not valid'}, HTTPStatus.BAD_REQUEST

        if db.get_user_tier(user_id) == c.USER_TIER_PRO:
            return {'message': 'You are already pro'}, HTTPStatus.CONFLICT

        response = db.upgrade_pro(user_id)

        if response:
            return None, HTTPStatus.NO_CONTENT
        return {'message': 'User not found'}, HTTPStatus.NOT_FOUND
