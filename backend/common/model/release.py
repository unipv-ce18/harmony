from collections import namedtuple

from .song import Song

_release_tuple = namedtuple('Release', [
    'id',
    'name',
    'date',
    'artist',
    'type',
    'cover',
    'songs'
])


class Release:
    def __init__(self, release_data=None):
        my_data = {}
        if release_data is None:
            release_data = {}

        if 'songs' in release_data:
            my_data['songs'] = [Song(song) for song in release_data['songs']]
        if '_id' in release_data:
            my_data['id'] = str(release_data['_id'])
        if 'artist' in release_data:
            my_data['artist'] = {
                'id': str(release_data['artist']['id']),
                'name': release_data['artist']['name']
            }

        for f in _release_tuple._fields:
            if f not in my_data:
                my_data[f] = release_data[f] if f in release_data else None
        self.data = _release_tuple(**my_data)

    def __getattr__(self, item):
        return getattr(self.data, item)

    def __repr__(self):
        release = ''
        for k, v in self.data._asdict().items():
            release += f'\n\t\t{k}: {v}'
        return release

    def __str__(self):
        release = ''
        for k, v in self.data._asdict().items():
            release += f'{k}: {v}\n'
        return release

    def to_dict(self):
        return dict(self.data._asdict())
