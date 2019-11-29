from collections import namedtuple
from .song import Song


_fields = ['id', 'name', 'date', 'artist', 'type', 'cover', 'songs']
_default_release = {f: None for f in _fields}


class Release:
    def __init__(self, release=_default_release):
        release_tuple = namedtuple('Release', _fields)
        if 'songs' in release:
            release['songs'] = [Song(song) for song in release['songs']]
        for i in release_tuple._fields:
            if i not in release:
                release[i] = None
        self.release = release_tuple(**release)

    def __repr__(self):
        release = ''
        for k, v in self.release._asdict().items():
            release += f'\n\t\t{k}: {v}'
        return release

    def __str__(self):
        release = ''
        for k, v in self.release._asdict().items():
            release += f'{k}: {v}\n'
        return release

    def get_release_as_dict(self):
        return dict(self.release._asdict())
