import unittest

from apiserver import create_app


class EndpointGenericTest(unittest.TestCase):

    # Executed before each test
    def setUp(self):
        app = create_app()
        app.config['TESTING'] = True
        self.client = app.test_client()

    # Executed after each test
    def tearDown(self):
        pass

    def test_api_hello_world(self):
        rv = self.client.get('/api/v1/sayhello', follow_redirects=True)
        self.assertEqual(200, rv.status_code)
        self.assertEqual({'hello': 'world'}, rv.get_json())


if __name__ == '__main__':
    unittest.main()
