import unittest

from .api_test_utils import create_test_app


class EndpointGenericTest(unittest.TestCase):

    # Executed before each test
    def setUp(self):
        app, client = create_test_app()
        self.client = client

    # Executed after each test
    def tearDown(self):
        pass

    def test_api_hello_world(self):
        rv = self.client.get('/api/v1/sayhello', follow_redirects=True)
        self.assertEqual(200, rv.status_code)
        self.assertEqual({'hello': 'world'}, rv.get_json())


if __name__ == '__main__':
    unittest.main()
