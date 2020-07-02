from collections import namedtuple


_user_tuple = namedtuple('User', [
    'id',
    'type',
    'tier',
    'username',
    'email',
    'password',
    'bio',
    'avatar_url',
    'prefs',
    'library'
])


class User(_user_tuple):

    def __repr__(self):
        user = ''
        for k, v in self._asdict().items():
            user += f'\n\t{k}: {v}\n'
        return user

    def __str__(self):
        user = ''
        for k, v in self._asdict().items():
            user += f'{k}: {v}\n'
        return user

    def to_dict(self):
        return dict(self._asdict())
