from flask_socketio import SocketIOTestClient
from apiserver import socketio
from apiserver import create_app
from time import sleep
import os


app = create_app(os.environ.get('FLASK_CONFIG', 'development'))

socket_client = SocketIOTestClient(app, socketio)
socket_client.connect()

socket_client.emit('play_song', {'id': '5dfd65de57475213eea24182'})
socket_client.emit('play_song', {'id': '5dfd65de57475213eea24191'})

sleep(20)
print(socket_client.get_received())
