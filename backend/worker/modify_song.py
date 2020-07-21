import logging
import os
import shutil
import subprocess

import librosa
from ffmpy import FFmpeg, FFExecutableNotFoundError, FFRuntimeError

from . import worker_config

log = logging.getLogger(__name__)


_tmp_folder = worker_config.WORK_DIR
_tmp_subfolder = 'changes'


class ModifySong:
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

    def change_pitch(self, song_id, semitones, output_format):
        """Change pitch to a song.

        Save the output song in wav format (the only one supported by librosa).

        :param str song_id: id of the song to change the pitch
        :param float semitones: how many semitones the song has to be shifted
        :param str output_format: the extension of the ouput song
        """
        in_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}'
        out_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}_{semitones}.wav'

        song, samplerate = librosa.load(in_file, sr=None)
        song_shifted = librosa.effects.pitch_shift(song, samplerate, n_steps=semitones)
        librosa.output.write_wav(out_file, song_shifted, sr=samplerate, norm=False)

    def split_song(self, song_id, semitones, output_format):
        """Create two different tracks for the song.

        The first track is the vocal track (vocal.wav), the second is the instrumental
        track (accompaniment.wav). The parameters are used to construct the path
        where to save the tracks.

        :param str song_id: id of the song
        :param float semitones: how many semitones the song has been shifted
        :param str output_format: the extension of the song
        """
        in_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}_{semitones}.wav'

        command = [
            'python3',
            '-m',
            'spleeter',
            'separate',
            '-i',
            in_file,
            '-o',
            f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}'
        ]

        subprocess.run(command)

    def make_zip(self, song_id, semitones, output_format):
        """Zip the vocal and accompaniment audio files."""
        shutil.make_archive(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}_{semitones}',
                            'zip', f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}_{semitones}')

    def transcode_to_output_format(self, song_id, semitones, output_format, path):
        """Transcode the song in the ouput format.

        :param str song_id: id of the song to be transcoded
        :param float semitones: how many semitones the song has been shifted
        :param str output_format: the extension of the ouput song
        :raise: `FFRuntimeError` in case FFmpeg command exits with a non-zero code;
                `FFExecutableNotFoundError` in case the executable path passed was not valid
        """
        if output_format == 'wav':
            return 'wav'

        in_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{path}.wav'
        out_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{path}.{output_format}'

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

    def download_song_from_storage_server(self, song_id, semitones, output_format):
        """Download the song to change the pitch from storage server.

        :param str song_id: id of the song to change the pitch
        :return: True if song is downloaded, False otherwise
        :rtype: bool
        """
        if not os.path.exists(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}'):
            os.makedirs(os.path.join(_tmp_folder, _tmp_subfolder, f'{song_id}-{semitones}-{output_format}'))
        return self.st.download_file(worker_config.STORAGE_BUCKET_REFERENCE, song_id, f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}')

    def upload_files_to_storage_server(self, song_id, semitones, output_format, split):
        """Upload song with pitch changed to storage server.

        :param str song_id: id of the song
        :param float semitones: semitones
        :param str output_format: the extension of the song
        """
        filename = f'{song_id}_{semitones}.{output_format}'
        if split:
            filename = f'{song_id}_{semitones}.zip'
        self.st.upload_file(worker_config.STORAGE_BUCKET_MODIFIED,
                            filename,
                            f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}')

    def upload_song_version_data(self, song_id, semitones, output_format, split):
        """Upload version data of the song in the database.

        :param str song_id: id of the song changed
        :param float semitones: how many semitones the song has been shifted
        :param str output_format: the extension of the ouput song
        """
        filename = f'{song_id}_{semitones}.{output_format}'
        if split:
            filename = f'{song_id}_{semitones}.zip'
        version_data = {
            'semitones': semitones,
            'output_format': output_format,
            'split': split,
            'filename': filename
        }
        self.db.put_song_version_data(song_id, version_data)

    def remove_pending_song(self, id):
        """Remove the id of the pending song in RabbitMQ queue from database.

        :param str id: id of the song
        """
        self.db.remove_modified_pending_song(id)

    def delete_split_tmp_files(self, song_id, semitones, output_format):
        """Delete the split temporary files."""
        os.remove(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}_{semitones}/vocals.wav')
        os.remove(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}/{song_id}_{semitones}/accompaniment.wav')

    def clear_tmp_files(self, song_id, semitones, output_format):
        """Remove temporary changing pitch jobs file.

        :param str song_id: id of the song
        :param float semitones: semitones
        :param str output_format: the extension of the ouput song
        """
        shutil.rmtree(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}-{semitones}-{output_format}')

    def complete_modify_song(self, song_id, semitones, output_format, split):
        """Perform a complete modifying song process.

        Retrieve the song from the storage server, change the pitch, if requested
        split the song in vocal and accompaniment tracks, transcode to
        the desired output format. Upload the song to the storage server.
        Delete all the local temporary files.

        :param str song_id: id of the song to change the pitch
        :param float semitones: how many semitones the song has to be shifted
        :param str output_format: the extension of the ouput song
        :param bool split: if True, split the pitched song in two different audio
            files: vocal and accompainement
        """
        log.info('%s: Modifying song job started', song_id)

        if self.download_song_from_storage_server(song_id, semitones, output_format):
            try:
                self.change_pitch(song_id, semitones, output_format)
                if split:
                    self.split_song(song_id, semitones, output_format)
                    self.transcode_to_output_format(song_id, semitones, output_format, f'{song_id}_{semitones}/vocals')
                    output_format = self.transcode_to_output_format(song_id, semitones, output_format, f'{song_id}_{semitones}/accompaniment')
                    if output_format != 'wav':
                        self.delete_split_tmp_files(song_id, semitones, output_format)
                    self.make_zip(song_id, semitones, output_format)
                else:
                    output_format = self.transcode_to_output_format(song_id, semitones, output_format, f'{song_id}_{semitones}')

                self.upload_files_to_storage_server(song_id, semitones, output_format, split)
                self.upload_song_version_data(song_id, semitones, output_format, split)

                log.info('%s: Modifying song job finished', song_id)
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
