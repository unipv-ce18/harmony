import os

import yaml
from flask import Blueprint
from flask.blueprints import BlueprintSetupState

from apiserver.util.api_explorer import OPT_SPEC_TEMPLATE


api_blueprint = Blueprint('api', __name__)
db = None
transcoder_client = None


@api_blueprint.record
def on_register(state: BlueprintSetupState):
    global db, transcoder_client
    db = state.options['db']
    transcoder_client = state.options['transcoder_client']

    # Load base API spec from file and pass it on to generator over setup state options
    with open(os.path.dirname(__file__) + '/spec.yml', 'r', encoding='utf-8') as f:
        state.options[OPT_SPEC_TEMPLATE] = yaml.full_load(f)

    # Import resources to register them with the blueprint
    # Do it only after registration so they see the updated db instance
    from . import hello_world, authentication, search, user_info,library,\
        playlist, user_upgrade, upload, song, release, artist, modify_song
