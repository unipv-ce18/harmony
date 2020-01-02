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
        release_dict = dict(self._asdict())
        if self.songs is not None:
            song_dict = [s.to_dict() for s in self.songs]
            release_dict['songs'] = song_dict
        return release_dict
