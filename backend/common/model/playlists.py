from collections import namedtuple


_playlists_tuple = namedtuple('Playlists', [
    'id',
    'name',
    'creator',
    'songs'
])


class Playlists(_playlists_tuple):

    def __repr__(self):
        playlists = ''
        for k, v in self._asdict().items():
            playlists += f'\n\t{k}: {v}\n'
        return playlists

    def __str__(self):
        playlists = ''
        for k, v in self._asdict().items():
            playlists += f'{k}: {v}\n'
        return playlists

    def to_dict(self):
        return dict(self._asdict())
