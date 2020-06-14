from collections import namedtuple


_library_tuple = namedtuple('Library', [
    'playlists',
    'artists',
    'releases',
    'songs'
])


class Library(_library_tuple):

    def __repr__(self):
        library = ''
        for k, v in self._asdict().items():
            library += f'\n\t{k}: {v}\n'
        return library

    def __str__(self):
        library = ''
        for k, v in self._asdict().items():
            library += f'{k}: {v}\n'
        return library

    def to_dict(self):
        return dict(self._asdict())
