import os

import eventlet
eventlet.monkey_patch()

from . import create_app, socketio


# Start the application using the Flask's builtin werkzeug dev server (execute from backend/ $ sudo python -m apiserver)
app = create_app(os.environ.get('FLASK_CONFIG', 'development'))
socketio.run(app, host='127.0.0.1', port=80)
