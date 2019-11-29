import os, subprocess
import ffmpy
import hashlib
from database.database import Database
from model.song import Song


def _create_key(id):
    id = id.encode('utf-8')
    salt = os.urandom(40)
    hash = hashlib.md5(id + salt).hexdigest()
    return hash


_bitrate = ['96k', '160k', '320k']


class Transcoder:
    def __init__(self, db_connection):
        self.db = Database(db_connection)

    def transcoding_song(self, id, bitrate='160k', sample_rate=44100, channels=2, extension='.webm'):
        lossless_song = self.db.get_song(id).get_song_as_dict()
        title = lossless_song['title']
        artist = lossless_song['artist']['name']
        release = lossless_song['release']['name']

        input = f'lossless_songs/{title}.flac'
        output = f'compressed_songs/{id}-{bitrate.replace("k", "")}{extension}'

        metadata_title = f'title="{title}"'
        metadata_artist = f'artist="{artist}"'
        metadata_release = f'album="{release}"'
        m = [metadata_title, metadata_artist, metadata_release]
        metadata = ''
        for i in range(len(m)):
            metadata += f'-metadata {m[i]} '

        if channels > 2:
            channels = 2

        global_options = '-y'
        output_options = f'-b:a {bitrate} -ar {sample_rate} {metadata} -ac {channels} -acodec libvorbis -vn -map_metadata -1'

        ff = ffmpy.FFmpeg(
        	global_options=global_options,
        	inputs={input: None},
        	outputs={output: output_options}
        )
        ff.run()

    def transcoding(self, id, bitrate=_bitrate, sample_rate=44100, channels=2, extension='.webm'):
        for b in _bitrate:
            self.transcoding_song(id, b, sample_rate, channels, extension)

    def manifest_creation(self, id):
        key_id = _create_key(id)
        key = _create_key(id)
        path = os.path.realpath(os.path.dirname(__file__))
        bitrate = [b.replace('k','') for b in _bitrate]

        command = [
            f'{path}/packager-linux',
            f'in=compressed_songs/{id}-{bitrate[0]}.webm,stream=audio,init_segment={id}/{bitrate[0]}_init.webm,segment_template={id}/{bitrate[0]}_$Time$.webm,drm_label=AUDIO',
            f'in=compressed_songs/{id}-{bitrate[1]}.webm,stream=audio,init_segment={id}/{bitrate[1]}_init.webm,segment_template={id}/{bitrate[1]}_$Time$.webm,drm_label=AUDIO',
            f'in=compressed_songs/{id}-{bitrate[2]}.webm,stream=audio,init_segment={id}/{bitrate[2]}_init.webm,segment_template={id}/{bitrate[2]}_$Time$.webm,drm_label=AUDIO',
            '--enable_raw_key_encryption',
            '--keys',
            f'label=AUDIO:key_id={key_id}:key={key}',
            '--generate_static_mpd',
            '--mpd_output',
            f'{id}/manifest.mpd'
        ]
        subprocess.run(command)

        self.db.update_song_transcoding_info(id, key_id, key)
