import unittest
from unittest.mock import patch

from flask_socketio import SocketIOTestClient

from apiserver import socketio
from .api_test_utils import create_test_app, get_test_access_token


NS_NAME = '/playback'


class EndpointSocketTest(unittest.TestCase):

    def setUp(self):
        app, client = create_test_app()
        self.app = app
        self.client = client
        self.token = get_test_access_token(client)
        self.playback_ns = socketio.server.namespace_handlers[NS_NAME]

    def _make_socket_client(self, auth=True):
        query = f'access_token={self.token}' if auth else None
        return SocketIOTestClient(self.app, socketio, namespace=NS_NAME, query_string=query)

    def test_connect_no_token(self):
        with patch.object(self.playback_ns, 'on_hello') as hello_mock:
            socket_client = self._make_socket_client(auth=False)
            self.assertFalse(socket_client.connected[NS_NAME])

            with self.assertRaises(RuntimeError):
                socket_client.emit('hello', 'not called', namespace=NS_NAME)

            # Namespace methods should not be called since we failed authentication
            hello_mock.assert_not_called()

    def test_connect(self):
        message = 'freaking test'
        with patch.object(self.playback_ns, 'on_hello') as hello_mock:
            socket_client = self._make_socket_client(auth=True)
            self.assertTrue(socket_client.connected[NS_NAME])

            socket_client.emit('hello', message, namespace=NS_NAME)

            # Check if the hello event handler was called
            hello_mock.assert_called_once_with(message)
