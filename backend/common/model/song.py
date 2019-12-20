from collections import namedtuple

_song_tuple = namedtuple('Song', [
    'id',
    'title',
    'artist',
    'release',
    'length',
    'lyrics',
    'links',
    'reference_url',    # (lossless) reference file location
    'repr_data'         # object with playback data generated by transcoding
                        # (i.e. EME key material, manifest path, waveform data, ...)
])


class Song(_song_tuple):

    def __repr__(self):
        song = ''
        for k, v in self._asdict().items():
            song += f'\n\t\t\t\t{k}: {v}'
        return song

    def __str__(self):
        song = ''
        for k, v in self._asdict().items():
            song += f'{k}: {v}\n'
        return song

    def to_dict(self):
        return dict(self._asdict())
