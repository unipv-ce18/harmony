from flask_restful import Resource, Api

from . import api_blueprint


api = Api(api_blueprint)


@api.resource('/sayhello')
class HelloWorld(Resource):
    def get(self):
        return {'hello': 'Cipolla'}
