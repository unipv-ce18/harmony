from collections import namedtuple

_user_tuple = namedtuple('User', [
    'id',
    'type',
    'tier',
    'first_name',
    'last_name',
    'username',
    'email',
    'password',
    'bio',
    'location',
    'avatar_url',
    'stats',
    'prefs'
])


class User(_user_tuple):

    def __getattr__(self, item):
        return getattr(self.data, item)

    def __str__(self):
        user = ''
        for k, v in self._asdict().items():
            user += f'{k}: {v}\n'
        return user

    def __repr__(self):
        user = ''
        for k, v in self._asdict().items():
            user += f'\n\t{k}: {v}\n'
        return user

    def to_dict(self):
        return dict(self._asdict())
