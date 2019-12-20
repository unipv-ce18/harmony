class TokenOpsMixin:

    def __init__(self, db_connection):
        super().__init__(db_connection)
        self.blacklist = db_connection['blacklist']

    def store_token(self, token):
        _my_token = {
            'jti': token['jti'],
            'user_identity': token['identity'],
            'type': token['type'],
            'exp': token['exp'],
            'revoked': False
        }
        return self.blacklist.insert_one(_my_token)

    def revoke_token(self, token_id):
        self.blacklist.update_one({'jti': token_id}, {'$set': {'revoked': True}})

    def is_token_revoked(self, token):
        _tok = self.blacklist.find_one({'jti': token['jti']})
        return True if _tok is None else _tok['revoked']
