from flask import Flask

application = Flask(__name__)


# TODO: serve the flask application from this file instead of endpoint.py

@application.route('/api/v1/sayhello')
def home():
    """A sample response used by docker health check"""
    return "Lbhe Pbzchgre vf Zvar"
