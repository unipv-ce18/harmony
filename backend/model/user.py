from collections import namedtuple


_fields = [
    'id',
    'first_name',
    'last_name',
    'username',
    'email',
    'password',
    'bio',
    'avatar_url',
    'stats',
    'prefs',
    'api-key'
]
_default_user = {f: None for f in _fields}


class User:
    def __init__(self, user=_default_user):
        user_tuple = namedtuple('User', _fields)
        for i in user_tuple._fields:
            if i not in user:
                user[i] = None
        self.user = user_tuple(**user)

    def __repr__(self):
        user = ''
        for k, v in self.user._asdict().items():
            user += f'{k}: {v}\n'
        return user

    def get_user_as_dict(self):
        return dict(self.user._asdict())
