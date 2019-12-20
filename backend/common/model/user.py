from collections import namedtuple

_user_tuple = namedtuple('User', [
    'id',
    'first_name',
    'last_name',
    'username',
    'email',
    'password',
    'bio',
    'avatar_url',
    'stats',
    'prefs'
])


class User:
    def __init__(self, user=None):
        if user is None:
            user = {}
        if 'id' in user:
            user['id'] = str(user['id'])
        for i in _user_tuple._fields:
            if i not in user:
                user[i] = None
        self.data = _user_tuple(**user)

    def __getattr__(self, item):
        return getattr(self.data, item)

    def __repr__(self):
        user = ''
        for k, v in self.data._asdict().items():
            user += f'{k}: {v}\n'
        return user

    def to_dict(self):
        return dict(self.data._asdict())
