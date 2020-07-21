import logging
import os

import librosa
from ffmpy import FFmpeg, FFExecutableNotFoundError, FFRuntimeError

from . import worker_config

log = logging.getLogger(__name__)


_tmp_folder = worker_config.WORK_DIR
_tmp_subfolder = 'pitch'


class ChangePitch:
    def __init__(self, db_interface, storage_interface):
        """Initialize ChangePitch.

        Retrieve instances of database and storage connections. Create the
        temporary folders used during the change pitch process.

        :param common.database.Database db_interface: database handling interface
        :param common.storage.Storage storage_interface: storage interface
        """
        self.db = db_interface
        self.st = storage_interface

        if not os.path.exists(_tmp_folder):
            os.makedirs(_tmp_folder)
        if not os.path.exists(f'{_tmp_folder}/{_tmp_subfolder}'):
            os.makedirs(os.path.join(_tmp_folder, _tmp_subfolder))

    def change_pitch(self, song_id, semitones):
        """Change pitch to a song.

        Save the output song in wav format (the only one supported by librosa).

        :param str song_id: id of the song to change the pitch
        :param float semitones: how many semitones the song has to be shifted
        """
        in_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}'
        out_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}_{semitones}.wav'

        song, samplerate = librosa.load(in_file, sr=None)
        song_shifted = librosa.effects.pitch_shift(song, samplerate, n_steps=semitones)
        librosa.output.write_wav(out_file, song_shifted, sr=samplerate, norm=False)

    def transcode_to_output_format(self, song_id, semitones, output_format):
        """Transcode the song in the ouput format.

        :param str song_id: id of the song to be transcoded
        :param float semitones: how many semitones the song has been shifted
        :param str output_format: the extension of the ouput song
        :raise: `FFRuntimeError` in case FFmpeg command exits with a non-zero code;
                `FFExecutableNotFoundError` in case the executable path passed was not valid
        """
        if output_format == 'wav':
            return 'wav'

        in_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}_{semitones}.wav'
        out_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}_{semitones}.{output_format}'

        metadata = self.metadata(song_id)

        channels = 2

        if output_format == 'webm':
            output_options = f'-b:a {worker_config.BITRATE_WEBM}k {metadata} -ac ' \
                             f'{channels} -acodec libvorbis -vn -map_metadata -1'
        elif output_format == 'mp3':
            output_options = f'-b:a {worker_config.BITRATE_MP3}k {metadata} -ac ' \
                             f'{channels} -vn -map_metadata -1'
        else:
            return 'wav'

        global_options = '-y'

        ff = FFmpeg(
            global_options=global_options,
            inputs={in_file: None},
            outputs={out_file: output_options}
        )
        ff.run()

        return output_format

    def metadata(self, id):
        """Generate metadata for song from database information.

        :param str id: id of the song to be transcoded
        """
        song = self.db.get_song(id)
        m = [
            f'title="{song.title}"',
            f'artist="{song.artist.get("name")}"',
            f'album="{song.release.get("name")}"'
        ]
        metadata = ''
        for i in range(len(m)):
            metadata += f'-metadata {m[i]} '
        return metadata

    def download_song_from_storage_server(self, song_id):
        """Download the song to change the pitch from storage server.

        :param str song_id: id of the song to change the pitch
        :return: True if song is downloaded, False otherwise
        :rtype: bool
        """
        return self.st.download_file(worker_config.STORAGE_BUCKET_REFERENCE, song_id, f'{_tmp_folder}/{_tmp_subfolder}')

    def upload_files_to_storage_server(self, song_id, semitones, output_format):
        """Upload song with pitch changed to storage server.

        :param str song_id: id of the song
        :param float semitones: semitones
        :param str output_format: the extension of the song
        """
        self.st.upload_file(worker_config.STORAGE_BUCKET_PITCH, f'{song_id}_{semitones}.{output_format}', f'{_tmp_folder}/{_tmp_subfolder}')

    def upload_song_version_data(self, song_id, semitones, output_format):
        """Upload version data of the song in the database.

        :param str song_id: id of the song changed
        :param float semitones: how many semitones the song has been shifted
        :param str output_format: the extension of the ouput song
        """
        version_data = {'semitones': semitones, 'output_format': output_format}
        self.db.put_song_version_data(song_id, version_data)

    def remove_pending_song(self, id):
        """Remove the id of the pending song in RabbitMQ queue from database.

        :param str id: id of the song
        """
        self.db.remove_pitch_pending_song(id)

    def clear_tmp_files(self, song_id, semitones, output_format):
        """Remove temporary changing pitch jobs file.

        :param str song_id: id of the song
        :param float semitones: semitones
        :param str output_format: the extension of the output song
        """
        os.remove(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}')
        os.remove(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}_{semitones}.wav')
        os.remove(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}_{semitones}.{output_format}')

    def complete_change_pitch(self, song_id, semitones, output_format):
        """Perform a complete changing pitch process on a song.

        Retrieve the song from the storage server, change the pitch, transcode to
        the desired output format. Upload the song to the storage server.
        Delete all the local temporary files.

        :param str song_id: id of the song to change the pitch
        :param float semitones: how many semitones the song has to be shifted
        :param str output_format: the extension of the ouput song
        """
        log.info('%s: Changing pitch job started', song_id)

        if self.download_song_from_storage_server(song_id):
            try:
                self.change_pitch(song_id, semitones)
                output_format = self.transcode_to_output_format(song_id, semitones, output_format)
                self.upload_song_version_data(song_id, semitones, output_format)
                self.upload_files_to_storage_server(song_id, semitones, output_format)

                log.info('%s: Changing pitch job finished', song_id)
            except FFExecutableNotFoundError:
                log.error('Executable path not valid')
            except FFRuntimeError as e:
                log.exception('FFRuntimeError: %s', e)
            except Exception as e:
                log.exception('%s(%s)', type(e).__name__, e)
            finally:
                try:
                    self.clear_tmp_files(song_id, semitones, output_format)
                except FileNotFoundError:
                    pass
        else:
            log.error('%s: Failed to download source from server', song_id)

        self.remove_pending_song(song_id)
