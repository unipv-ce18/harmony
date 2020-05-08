from flask_restful import Resource, Api

from . import api_blueprint


api = Api(api_blueprint)


@api.resource('/sayhello')
class HelloWorld(Resource):

    def get(self):
        """Says hello! 👋
        ---
        tags:
          - misc
        security: []
        responses:
          200:
            description: The server's answer, waving hand not included
            content:
              application/json:
                example: {'hello': 'Cipolla'}
        """
        return {'hello': 'Cipolla'}
