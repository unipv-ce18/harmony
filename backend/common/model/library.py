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
        library_dict = dict(self._asdict())
        if self.playlists is not None:
            playlists_dict = [p.to_dict() for p in self.playlists] \
                if isinstance(self.playlists, list) else self.playlists.to_dict()
            library_dict['playlists'] = playlists_dict
        return library_dict
