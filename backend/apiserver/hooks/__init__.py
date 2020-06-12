from flask import Blueprint
from flask.blueprints import BlueprintSetupState

webhook_blueprint = Blueprint('webhooks', __name__)
db = None


@webhook_blueprint.record
def on_register(state: BlueprintSetupState):
    global db
    db = state.options['db']

    from . import s3  # noqa
