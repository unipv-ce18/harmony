from collections import namedtuple

from .release import Release

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


class Artist:
    def __init__(self, db_document=None):
        my_data = {}
        if db_document is None:
            db_document = {}

        if 'releases' in db_document:
            my_data['releases'] = [Release(release) for release in db_document['releases']]
        if '_id' in db_document:
            my_data['id'] = str(db_document['_id'])

        for f in _artist_tuple._fields:
            if f not in my_data:
                my_data[f] = db_document[f] if f in db_document else None
        self.data = _artist_tuple(**my_data)

    def __getattr__(self, item):
        return getattr(self.data, item)

    def __repr__(self):
        artist = ''
        for k, v in self.data._asdict().items():
            artist += f'\n\t{k}: {v}'
        return artist

    def __str__(self):
        artist = ''
        for k, v in self.data._asdict().items():
            artist += f'{k}: {v}\n'
        return artist

    def to_dict(self):
        return dict(self.data._asdict())
