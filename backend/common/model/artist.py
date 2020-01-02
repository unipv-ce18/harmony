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
        artist_dict = dict(self._asdict())
        if self.releases is not None:
            release_dict = [r.to_dict() for r in self.releases] \
                if isinstance(self.releases, list) else self.releases.to_dict()
            artist_dict['releases'] = release_dict
        return artist_dict
