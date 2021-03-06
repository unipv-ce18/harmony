from flask_restful import Resource, Api

from . import api_blueprint
from common.version import BACKEND_VERSION
from common.messaging.amq_util import machine_id

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
                example: {'hello': 'Cipolla', 'version': 'dirt~ea460da', 'node_id': '28037ec0200'}
        """
        return {'hello': 'Cipolla', 'version': BACKEND_VERSION, 'node_id': machine_id}
