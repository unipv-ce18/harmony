from . import application

# Start the application using the Flask's builtin werkzeug dev server (execute from backend/ $ python -m apiserver)
application.run(host='127.0.0.1', port=5000)
