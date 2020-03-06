from flask_socketio import SocketIOTestClient
from apiserver import app, socketio
from time import sleep


socket_client = SocketIOTestClient(app, socketio)
socket_client.connect()

socket_client.emit('transcoding', '5dfd65de57475213eea24182')
socket_client.emit('transcoding', '5dfd65de57475213eea24190')

sleep(20)
print(socket_client.get_received())
