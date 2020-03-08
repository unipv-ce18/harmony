import eventlet
eventlet.monkey_patch()

from . import app, socketio


# Start the application using the Flask's builtin werkzeug dev server (execute from backend/ $ python -m apiserver)
socketio.run(app, host='127.0.0.1', port=5000)
