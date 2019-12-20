from collections import namedtuple

_release_tuple = namedtuple('Release', [
    'id',
    'name',
    'date',
    'artist',
    'type',
    'cover',
    'songs'
])


class Release(_release_tuple):

    def __repr__(self):
        release = ''
        for k, v in self._asdict().items():
            release += f'\n\t\t{k}: {v}'
        return release

    def __str__(self):
        release = ''
        for k, v in self._asdict().items():
            release += f'{k}: {v}\n'
        return release

    def to_dict(self):
        return dict(self._asdict())
