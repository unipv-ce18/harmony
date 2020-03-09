import os

from apiserver import create_app


# Create an application instance to be used by Gunicorn.
# "application" is the default name, also store as "app" for convenience
application = app = create_app(os.environ.get('FLASK_CONFIG', 'production'))
