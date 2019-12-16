import unittest

from apiserver.endpoint import app


class EndpointGenericTest(unittest.TestCase):

    # Executed before each test
    def setUp(self):
        app.config['TESTING'] = True
        self.app = app.test_client()

    # Executed after each test
    def tearDown(self):
        pass

    def test_api_hello_world(self):
        rv = self.app.get('/api/v1/sayhello', follow_redirects=True)
        self.assertEqual(200, rv.status_code)
        self.assertEqual({'hello': 'world'}, rv.get_json())


if __name__ == '__main__':
    unittest.main()
