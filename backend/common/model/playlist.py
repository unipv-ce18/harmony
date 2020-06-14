from collections import namedtuple


_playlist_tuple = namedtuple('Playlist', [
    'id',
    'name',
    'creator',
    'policy',
    'songs'
])


class Playlist(_playlist_tuple):

    def __repr__(self):
        playlist = ''
        for k, v in self._asdict().items():
            playlist += f'\n\t{k}: {v}\n'
        return playlist

    def __str__(self):
        playlist = ''
        for k, v in self._asdict().items():
            playlist += f'{k}: {v}\n'
        return playlist

    def to_dict(self):
        return dict(self._asdict())
