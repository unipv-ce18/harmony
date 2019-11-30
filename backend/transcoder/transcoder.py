import os, subprocess, shutil
import ffmpy
import hashlib
from database.database import Database
from storage.storage import Storage
from model.song import Song


def _create_key(id):
    id = id.encode('utf-8')
    salt = os.urandom(40)
    hash = hashlib.md5(id + salt).hexdigest()
    return hash


_bitrate = ['96', '160', '320']

_tmp_folder = 'tmp'
_tmp_subfolder = ['compressed_songs', 'manifest_files']


class Transcoder:
    def __init__(self, db_connection, minio_connection):
        self.db = Database(db_connection)
        self.st = Storage(minio_connection)

        if not os.path.exists(_tmp_folder):
            os.makedirs(_tmp_folder)
        for subfolder in _tmp_subfolder:
            if not os.path.exists(f'{_tmp_folder}/{subfolder}'):
                os.makedirs(os.path.join(_tmp_folder, subfolder))

    def transcoding_song(self, id, bitrate='160', sample_rate=44100, channels=2, extension='.webm'):
        file_name = f'{id}.flac'
        output_file_name = f'{id}-{bitrate}{extension}'

        lossless_song = self.st.download_file('lossless-songs', file_name, _tmp_folder)
        lossless_song_info = self.db.get_song(id).get_song_as_dict()

        input = f'{_tmp_folder}/{file_name}'
        output = f'{_tmp_folder}/{_tmp_subfolder[0]}/{output_file_name}'

        m = [
            f'title="{lossless_song_info["title"]}"',
            f'artist="{lossless_song_info["artist"]["name"]}"',
            f'album="{lossless_song_info["release"]["name"]}"'
        ]
        metadata = ''
        for i in range(len(m)):
            metadata += f'-metadata {m[i]} '

        if channels > 2:
            channels = 2

        global_options = '-y'
        output_options = f'-b:a {bitrate}k -ar {sample_rate} {metadata} -ac {channels} -acodec libvorbis -vn -map_metadata -1'

        ff = ffmpy.FFmpeg(
        	global_options=global_options,
        	inputs={input: None},
        	outputs={output: output_options}
        )
        ff.run()
        self.st.upload_file('compressed-songs', output_file_name, f'{_tmp_folder}/{_tmp_subfolder[0]}')

    def transcoding(self, id, bitrate=_bitrate, sample_rate=44100, channels=2, extension='.webm'):
        for b in _bitrate:
            self.transcoding_song(id, b, sample_rate, channels, extension)

    def manifest_creation(self, id):
        key_id = _create_key(id)
        key = _create_key(id)
        param = lambda id, bitrate : f'in={_tmp_folder}/{_tmp_subfolder[0]}/{id}-{bitrate}.webm,\
                                      stream=audio,init_segment={_tmp_folder}/{id}/{bitrate}_init.webm,\
                                      segment_template={_tmp_folder}/{id}/{bitrate}_$Time$.webm,\
                                      drm_label=AUDIO'

        packager_path = os.path.realpath(os.path.dirname(__file__))
        manifest_file_name = f'{id}.mpd'
        manifest_path = f'{_tmp_folder}/{_tmp_subfolder[1]}/{id}'

        command = [
            f'{packager_path}/packager-linux',
            param(id, _bitrate[0]),
            param(id, _bitrate[1]),
            param(id, _bitrate[2]),
            '--enable_raw_key_encryption',
            '--keys',
            f'label=AUDIO:key_id={key_id}:key={key}',
            '--generate_static_mpd',
            '--mpd_output',
            f'{manifest_path}/{manifest_file_name}'
        ]

        subprocess.run(command)

        self.st.upload_file('manifest-files', manifest_file_name, manifest_path)
        self.st.upload_folder('init-segments', _tmp_folder, id)

        self.db.update_song_transcoding_info(id, key_id, key)

    def clear_transcoding_tmp_files(self, id, extension='.webm'):
        for b in _bitrate:
            os.remove(f'{_tmp_folder}/{_tmp_subfolder[0]}/{id}-{b}{extension}')
        shutil.rmtree(f'{_tmp_folder}/{_tmp_subfolder[1]}/{id}')
        shutil.rmtree(f'{_tmp_folder}/{id}')
        os.remove(f'{_tmp_folder}/{id}.flac')

    def complete_transcode(self, id, bitrate=_bitrate, sample_rate=44100, channels=2, extension='.webm'):
        self.transcoding(id, bitrate, sample_rate, channels, extension)
        self.manifest_creation(id)
        self.clear_transcoding_tmp_files(id, extension)
