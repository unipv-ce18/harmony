from collections import namedtuple
from .release import Release


_fields = [
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
]
_default_artist = {f: None for f in _fields}


class Artist:
    def __init__(self, artist=_default_artist):
        artist_tuple = namedtuple('Artist', _fields)
        if 'releases' in artist:
            artist['releases'] = [Release(release) for release in artist['releases']]
        for i in artist_tuple._fields:
            if i not in artist:
                artist[i] = None
        self.artist = artist_tuple(**artist)

    def __repr__(self):
        artist = ''
        for k, v in self.artist._asdict().items():
            artist += f'\n\t{k}: {v}'
        return artist

    def __str__(self):
        artist = ''
        for k, v in self.artist._asdict().items():
            artist += f'{k}: {v}\n'
        return artist

    def get_artist_as_dict(self):
        return dict(self.artist._asdict())
