import logging
import os
import subprocess
import shutil
import hashlib

from ffmpy import FFmpeg, FFExecutableNotFoundError, FFRuntimeError

from . import transcoder_config

log = logging.getLogger(__name__)


def _create_key(id):
    id = id.encode('utf-8')
    salt = os.urandom(40)
    hash = hashlib.md5(id + salt).hexdigest()
    return hash


_bitrate = transcoder_config.VARIANTS_BITRATE

_tmp_folder = transcoder_config.WORK_DIR
_tmp_subfolder = 'upload'


class Transcoder:
    def __init__(self, db_interface, storage_interface):
        """Initialize Transcoder.

        Retrieve instances of database and storage connections. Create the
        temporary folders used during the transcode process.

        :param common.database.Database db_interface: database handling interface
        :param common.storage.Storage storage_interface: storage interface
        """
        self.db = db_interface
        self.st = storage_interface

        if not os.path.exists(_tmp_folder):
            os.makedirs(_tmp_folder)
        if not os.path.exists(f'{_tmp_folder}/{_tmp_subfolder}'):
            os.makedirs(os.path.join(_tmp_folder, _tmp_subfolder))

    def transcoding_song(self, id, bitrate=160, sample_rate=44100, channels=2, extension='.webm', include_metadata=False):
        """Transcode a song from flac format to the format specified in extension.

        input file: downloaded from lossless-songs bucket inside storage server
            and saved inside tmp folder.
            input-file-name = {id}.flac
        output file: saved inside tmp/compressed_songs folder.
            output-file-name = {id}-{bitrate}{extension} (default: {id}-160.webm)

        :param str id: id of the song to be transcoded and name of the input file
        :param str bitrate: the bitrate of the output song. The default bitrate
                            is 160 kbps
        :param int sample_rate: the sample rate of the output song. The default
                                sample rate is 44100 Hz
        :param int channels: the number of channels of the ouput song. The default
                             is 2, which stands for stereo; 1 is mono
        :param str extension: the extension of the ouput song. The default is .webm
        :param bool include_metadata: include metadata in the output song if True.
            The default value is False
        :raise: `FFRuntimeError` in case FFmpeg command exits with a non-zero code;
                `FFExecutableNotFoundError` in case the executable path passed was not valid
        """
        in_file = f'{_tmp_folder}/{id}.flac'
        out_file = f'{_tmp_folder}/{_tmp_subfolder}/{id}-{bitrate}{extension}'

        metadata = self.metadata(id) if include_metadata else ''

        if channels > 2:
            channels = 2

        global_options = '-y'
        output_options = f'-b:a {bitrate}k -ar {sample_rate} {metadata} -ac {channels} ' \
                         f'-acodec libvorbis -vn -map_metadata -1'

        ff = FFmpeg(
            global_options=global_options,
            inputs={in_file: None},
            outputs={out_file: output_options}
        )
        ff.run()

    def metadata(self, id):
        """Generate metadata for song from database information.

        :param str id: id of the song to be transcoded
        """
        song = self.db.get_song(id)
        m = [
            f'title="{song.title}"',
            f'artist="{song.artist.name}"',
            f'album="{song.release.name}"'
        ]
        metadata = ''
        for i in range(len(m)):
            metadata += f'-metadata {m[i]} '
        return metadata

    def transcoding(self, id, sample_rate=44100, channels=2, extension='.webm', include_metadata=False):
        """Transcode a song in multiple bitrates.

        Use the different bitrates specified inside _bitrate list to create three
        different versions of the same song with three different qualities: low,
        medium and high.

        :param str id: id of the song to be transcoded and name of the input file
        :param int sample_rate: the sample rate of the output song. The default
                                sample rate is 44100 Hz
        :param int channels: the number of channels of the ouput song. The default
                             is 2, which stands for stereo; 1 is mono
        :param str extension: the extension of the ouput song. The default is .webm
        :param bool include_metadata: include metadata in the output song if True.
            The default value is False
        """
        for b in _bitrate:
            self.transcoding_song(id, b, sample_rate, channels, extension, include_metadata)

    def manifest_creation(self, id):
        """Create the manifest and the segments of a transcoded song.

        Create the manifest file and the segments of the three different versions
        of the transcoded song. The segments are encrypted using {key}, that has
        to be a string of 16 or 32 hex digits (md5 hash is 32 digits). The {key}
        and {key_id} are saved inside the database inside the song sub-document.
        The songs are retrieved from the output folder of the transcoder (tmp/compressed_songs).

        Use v2.3.0 packager-linux (https://github.com/google/shaka-packager/releases).

        manifest file: saved as manifest.mpd inside tmp/{id} folder.
        segments: saved inside tmp/{id} folder.
            - init: saved as {bitrate}_init.webm
            - template: saved as {bitrate}_$Time$.webm

        :param str id: id of the transcoded song
        :return: manifest data of the transcoded song
        :rtype: dict
        """
        key_id = _create_key(id)
        key = _create_key(id)
        param = lambda id, bitrate : f'in={_tmp_folder}/{_tmp_subfolder}/{id}-{bitrate}.webm,\
                                      stream=audio,init_segment={_tmp_folder}/{id}/{bitrate}_init.webm,\
                                      segment_template={_tmp_folder}/{id}/{bitrate}_$Time$.webm,\
                                      drm_label=AUDIO'

        manifest_path = f'{_tmp_folder}/{id}'
        manifest_name = 'manifest.mpd'

        command = [
            transcoder_config.PACKAGER_PATH,
            param(id, _bitrate[0]),
            param(id, _bitrate[1]),
            param(id, _bitrate[2]),
            '--enable_raw_key_encryption',
            '--keys',
            f'label=AUDIO:key_id={key_id}:key={key}',
            '--generate_static_mpd',
            '--mpd_output',
            f'{manifest_path}/{manifest_name}'
        ]

        subprocess.run(command)

        manifest_data = {
            'key_id': key_id,
            'key': key,
            'manifest': f'{id}/{manifest_name}'
        }
        return manifest_data

    def waveform_creation(self, id):
        """Create the waveform file of a transcoded song.

        Requires audiowaveform.

        :param str id: id of the transcoded song
        :return: waveform data of the transcoded song
        :rtype: dict
        """
        waveform_path = f'{_tmp_folder}/{id}'
        waveform_name = 'waveform.dat'

        command = [
            transcoder_config.AUDIOWAVEFORM_PATH,
            '-i',
            f'{_tmp_folder}/{id}.flac',
            '-o',
            f'{waveform_path}/{waveform_name}',
            '-z',
            str(transcoder_config.WAVEFORM_ZOOM),  # samples per pixel
            '-b',
            '8'     # bit
        ]

        subprocess.run(command)

        waveform_data = {
            'waveform': f'{id}/{waveform_name}'
        }
        return waveform_data

    def upload_song_repr_data(self, id, manifest_data, waveform_data):
        """Upload representation data of the song in the database.

        :param str id: id of the transcoded song
        :param dict manifest_data: manifest data of the transcoded song
        :param dict waveform_data: waveform data of the transcoded song
        """
        repr_data = {**manifest_data, **waveform_data}
        self.db.put_song_representation_data(id, repr_data)

    def download_song_from_storage_server(self, song_id):
        """Download the song to transcode from storage server.

        :param str song_id: id of the song to transcode
        :return: True if song is downloaded, False otherwise
        :rtype: bool
        """
        result = self.st.download_file(transcoder_config.STORAGE_BUCKET_REFERENCE, song_id, _tmp_folder)
        if result:
            os.rename(f'{_tmp_folder}/{song_id}', f'{_tmp_folder}/{song_id}.flac')
        return result

    def upload_files_to_storage_server(self, id, extension):
        """Upload transcode process files to storage server.

        Manifest file and segments are uploaded to compressed-songs bucket inside
        {id} folder.

        :param str id: id of the transcoded song
        :param str extension: the extension of the transcoded song. The default is .webm
        """
        self.st.upload_folder(transcoder_config.STORAGE_BUCKET_TRANSCODED, _tmp_folder, id)

    def remove_pending_song(self, id):
        """Remove the id of the pending song in RabbitMQ queue from database.

        :param str id: id of the transcoded song
        """
        self.db.remove_transcoder_pending_song(id)

    def clear_transcoding_tmp_files(self, id, extension='.webm'):
        """Delete all the temporary files created in the process of transcoding
        the song, making the manifest file and creating the segments.

        :param str id: id of the transcoded song
        :param str extension: the extension of the transcoded song. The default is .webm
        """
        os.remove(f'{_tmp_folder}/{id}.flac')
        for b in _bitrate:
            os.remove(f'{_tmp_folder}/{_tmp_subfolder}/{id}-{b}{extension}')
        shutil.rmtree(f'{_tmp_folder}/{id}')

    def complete_transcode(self, song_id, sample_rate=44100, channels=2, extension='.webm', include_metadata=False):
        """Perform a complete transcode process on a song.

        Retrieve the song from the storage server, transcode it in three different
        qualities, create the manifest, the segments and the waveform. Upload all the
        output files to the storage server. Delete all the local temporary files.

        :param str song_id: id of the song to be transcoded and name of the input file
        :param int sample_rate: the sample rate of the output song. The default
                                sample rate is 44100 Hz
        :param int channels: the number of channels of the ouput song. The default
                             is 2, which stands for stereo; 1 is mono
        :param str extension: the extension of the ouput song. The default is .webm
        :param bool include_metadata: include metadata in the output song if True.
            The default value is False
        """

        log.info('%s: Transcoding job started', song_id)

        if self.download_song_from_storage_server(song_id):
            try:
                self.transcoding(song_id, sample_rate, channels, extension, include_metadata)
                manifest_data = self.manifest_creation(song_id)
                waveform_data = self.waveform_creation(song_id)
                self.upload_song_repr_data(song_id, manifest_data, waveform_data)
                self.upload_files_to_storage_server(song_id, extension)

                log.info('%s: Transcoding job finished', song_id)
            except FFExecutableNotFoundError:
                log.error('Executable path not valid')
            except FFRuntimeError as e:
                log.exception('FFRuntimeError: %s', e)
            except Exception as e:
                log.exception('%s(%s)', type(e).__name__, e)
            finally:
                try:
                    self.clear_transcoding_tmp_files(song_id, extension)
                except FileNotFoundError:
                    pass
        else:
            log.error('%s: Failed to download source from server', song_id)

        self.remove_pending_song(song_id)
