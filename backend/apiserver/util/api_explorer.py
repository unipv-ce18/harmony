import os
from functools import partial

import flasgger
from flasgger.base import APISpecsView
from flask import url_for, Blueprint, request
from flask.blueprints import BlueprintSetupState
from jinja2 import Template


OPT_SPEC_TEMPLATE = 'spec_template'

# Skip flask/Jinja env and loaders - keep things simple and load the template ourselves...
with open(os.path.dirname(__file__) + '/api_explorer.html', 'r', encoding='utf-8') as f:
    _page_template = Template(f.read())

_blueprint_name = 'api_explorer'
_site_name = 'Explorer · Harmony API'


class ApiExplorer(flasgger.Swagger):
    """Serves the OpenAPI specification for this server, can be navigated using a built-in web UI

    This extends Flasgger, which is a bloated version of flask-swagger, but we need it to support OpenAPI 3.0:
    allowing us to use bearer authentication, not possible with the Swagger 2.0 specification

    The changes aim for zero-configuration, dynamic blueprints registration to decouple from different API version
    internals and a leaner, automated explorer interface better suited for our needs

    OAS 3.0 reference: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md
    """

    def __init__(self):
        super().__init__(config={'openapi': '3.0.0', 'headers': [], 'specs': []})

    def manage_blueprint(self, api_blueprint):
        # Add am API blueprint to our configuration, spec will be generated from registration parameters
        api_blueprint.record(self._on_blueprint_defer)

    def get_apispecs(self, endpoint='api'):
        # Overridden to patch the spec before returning to the client
        api_spec = super().get_apispecs(endpoint)

        # Retrieve spec from configuration
        spec = next(filter(lambda s: s['endpoint'] == endpoint, self.config['specs']), None)
        if not spec:
            raise RuntimeError(f'Can`t find specs by endpoint "{endpoint}"')

        # If the spec has a template, add it in
        spec_base = spec.get('template')
        if spec_base:
            api_spec.update(spec_base)

        # Add this server to the spec (do not use variables to make Insomnia happy)
        url_prefix = spec.get('url_prefix')
        api_spec['servers'] = [{
            'url': request.host_url + ('' if url_prefix is None else url_prefix.lstrip('/')),
            'description': 'This API server',
        }]

        # Strip path prefixes (e.g. /api/v1) from generated spec
        if url_prefix is not None:
            for p in list(api_spec['paths'].keys()):
                if p.startswith(url_prefix):
                    api_spec['paths'][p[len(url_prefix):]] = api_spec['paths'].pop(p)

        return api_spec

    def register_views(self, app):
        # Overridden for better API explorer, removal of unnecessary blueprint rules
        blueprint = Blueprint(_blueprint_name, flasgger.__name__,
                              template_folder='ui3/templates',
                              static_folder='ui3/static',
                              static_url_path='/flasgger_static')

        # API Explorer UI
        blueprint.add_url_rule('/', 'apidocs', self._handle_explorer_route)

        # Existing specs in config
        for spec in self.config['specs']:
            self._add_spec_rule(blueprint, spec)

        self.app.register_blueprint(blueprint)

    def _add_spec_rule(self, target, spec):
        """Copypasta from Flasgger code to add a Flask rule to handle a spec endpoint"""

        # Wrap the views in an arbitrary number of decorators.
        def wrap_view(view):
            if self.decorators:
                for decorator in self.decorators:
                    view = decorator(view)
            return view

        self.endpoints.append(spec['endpoint'])
        target.add_url_rule(spec['route'], spec['endpoint'],
                            view_func=wrap_view(APISpecsView.as_view(
                                spec['endpoint'],
                                loader=partial(self.get_apispecs, endpoint=spec['endpoint']))))

    def _on_blueprint_defer(self, state: BlueprintSetupState):
        """Called when a managed blueprint gets registered with Flask
        This is the only way we can get parameters like url_prefix
        """
        url_prefix = state.blueprint.url_prefix or state.options['url_prefix']
        spec = {
            'route': url_prefix + '/spec',
            'endpoint': state.blueprint.name + '.spec',
            "rule_filter": lambda rule: rule.rule.startswith(url_prefix),
            "model_filter": lambda tag: True,  # all in
            'template': state.options.get(OPT_SPEC_TEMPLATE),   # add: optional template for this blueprint's spec
            'url_prefix': url_prefix                            # add: optional url prefix to strip from paths
        }
        self.config['specs'].append(spec)
        self._add_spec_rule(self.app, spec)

    def _handle_explorer_route(self):
        """Route for the explorer UI, displaying the first spec registered with this class"""
        spec_url = request.host_url.rstrip('/') + url_for(self.config['specs'][0]['endpoint'])  # Use 1st spec in list

        return _page_template.render(
            site_name=_site_name,
            spec_url=spec_url,
            swagger_ui_bundle_js=url_for(f'{_blueprint_name}.static', filename='swagger-ui-bundle.js'),
            swagger_ui_css=url_for(f'{_blueprint_name}.static', filename='swagger-ui.css'))
