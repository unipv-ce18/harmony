from collections import namedtuple

_artist_tuple = namedtuple('Artist', [
    'id',
    'name',
    'sort_name',
    'country',
    'life_span',
    'genres',
    'bio',
    'members',
    'links',
    'image',
    'releases'
])


class Artist(_artist_tuple):

    def __repr__(self):
        artist = ''
        for k, v in self._asdict().items():
            artist += f'\n\t{k}: {v}'
        return artist

    def __str__(self):
        artist = ''
        for k, v in self._asdict().items():
            artist += f'{k}: {v}\n'
        return artist

    def to_dict(self):
        return dict(self._asdict())
