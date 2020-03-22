from apiserver import create_app


def create_test_app():
    app = create_app()
    app.config['TESTING'] = True
    return app, app.test_client()


def get_test_access_token(client):
    r = client.post('/api/v1/auth/login',
                    json={'identity': 'test', 'password': 'toniocartonio'})
    return r.json['access_token']
