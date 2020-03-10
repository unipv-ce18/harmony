from flask import Blueprint
from flask.blueprints import BlueprintSetupState


api_blueprint = Blueprint('api', __name__)
db = None


@api_blueprint.record
def on_register(state: BlueprintSetupState):
    global db
    db = state.options['db']

    # Import resources to register them with the blueprint
    # Do it only after registration so they see the updated db instance
    from . import hello_world, authentication, media_info, search  # noqa
