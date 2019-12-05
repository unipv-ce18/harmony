from collections import namedtuple


_fields = ['id', 'title', 'artist', 'release', 'length', 'lyrics', 'link', 'key_id', 'key']
_default_song = {f: None for f in _fields}


class Song:
    def __init__(self, song=_default_song):
        song_tuple = namedtuple('Song', _fields)
        for i in song_tuple._fields:
            if i not in song:
                song[i] = None
        self.song = song_tuple(**song)

    def __repr__(self):
        song = ''
        for k, v in self.song._asdict().items():
            song += f'\n\t\t\t\t{k}: {v}'
        return song

    def __str__(self):
        song = ''
        for k, v in self.song._asdict().items():
            song += f'{k}: {v}\n'
        return song

    def get_song_as_dict(self):
        return dict(self.song._asdict())
