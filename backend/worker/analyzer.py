import logging
import os

import aubio
import numpy as np
import music21
from mido import Message, MetaMessage, MidiFile, MidiTrack, second2tick, bpm2tempo

from . import worker_config

log = logging.getLogger(__name__)


_tmp_folder = worker_config.WORK_DIR
_tmp_subfolder = 'analysis'


class Analyzer:
    def __init__(self, db_interface, storage_interface):
        """Initialize Analyzer.

        Retrieve instances of database and storage connections. Create a single folder to store
        the midi file that can't be made implicit during the key analysis process.

        :param common.database.Database db_interface: database handling interface
        :param common.storage.Storage storage_interface: storage interface
        """
        self.db = db_interface
        self.st = storage_interface

        if not os.path.exists(_tmp_folder):
            os.makedirs(_tmp_folder)
        if not os.path.exists(f'{_tmp_folder}/{_tmp_subfolder}'):
            os.makedirs(os.path.join(_tmp_folder, _tmp_subfolder))

    def analyze_song(self, song_id):
        """compute song tempo and key.

        Retrieve the song from the database, download it in a temporary folder and compute the tempo.
        Also convert it to midi, store the temporary file and analyze the key.
        Tag the song to the database by adding tempo and key informations.
        At the end of this process no temp files should be left around.

        :param str song_id: id of the song to analyze
        """
        in_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}.flac'
        out_file = f'{_tmp_folder}/{_tmp_subfolder}/{song_id}.mid'

        log.info('%s: Analyzing job started', song_id)
        if self.download_song_from_storage_server(song_id):
            try:
                tempo = round(self.compute_tempo(in_file), 2)
                key = self.compute_key(in_file, out_file)
                self.upload_song_data(song_id, tempo, key)
                log.info(f'{song_id}: {tempo} BPM, {key.tonic.name}{key.mode}, {key.camelot}')
            except Exception as e:
                log.exception('%s(%s)', type(e).__name__, e)
            finally:
                try:
                    pass
                    # self.clear_tmp_files(song_id, in_file, out_file)
                except FileNotFoundError:
                    pass
        else:
            log.error('%s: Failed to download source from server', song_id)
        self.remove_pending_song(song_id)

    def compute_tempo(self, fin, samplerate=44100, win_size=512):
        """compute song tempo using specdiff estimation. A change in sample rate might affect tempo estimation by
        approximatively 1 BPM

        :param str fin: name of the song to analyze
        :param int samplerate: samplerate to use for tempo analysis. Defaults to 44.1kHz
        :param int win_size: window size
        :return int bpm_est: BPM estimation. 0 if beats are too few to perform an analysis (=less than 4)
        """
        s = aubio.source(fin, samplerate, win_size)
        o = aubio.tempo('specdiff', 1024, win_size, s.samplerate)
        beats = []
        total_frames = 0
        log.info('%s: Computing tempo...', fin)
        while True:
            samples, read = s()
            is_beat = o(samples)
            if is_beat:
                this_beat = o.get_last_s()
                beats.append(this_beat)
            total_frames += read
            if read < 512:
                break
        # Convert to periods and to bpm
        if len(beats) > 1:
            if len(beats) < 4:
                # the song is too short to recognize a tempo
                return 0
            bpms = 60. / np.diff(beats)
            bpm_est = np.median(bpms)
        else:
            # too few beats to recognize a tempo
            return 0
        return bpm_est

    @staticmethod
    def key_to_camelot(key: music21.key.Key):
        """Utility class to convert a key between standard and camelot notation.

        :param str key: song key estimated
        :return str mycamelot: input key converted to camelot notation
        """
        camelot = {"major": [('B', '1B'), ('F#', '2B'), ('Db', '3B'), ('Ab', '4B'),
                             ('Eb', '5B'), ('Bb', '6B'), ('F', '7B'), ('C', '8B'),
                             ('G', '9B'), ('D', '10B'), ('A', '11B'), ('E', '12B')],
                   "minor": [('Ab', '1A'), ('Eb', '2A'), ('Bb', '3A'), ('F', '4A'),
                             ('C', '5A'), ('G', '6A'), ('D', '7A'), ('A', '8A'),
                             ('E', '9A'), ('B', '10A'), ('F#', '11A'), ('Db', '12A')]}

        for index, entry in enumerate(camelot[key.mode]):
            if entry[0] == key.tonic.name:
                prev = camelot[key.mode][index - 1][1]
                next = camelot[key.mode][index + 1][1] if index < len(camelot[key.mode])-1 else camelot[key.mode][0][1]
                same = camelot["minor"][index][1] if key.mode == "major" else camelot["major"][index][1]
                mycamelot = {"camelot": entry[1],
                             "adjacency": [prev, next, same]}
                return mycamelot

    @staticmethod
    def frames2tick(frames, ticks_per_beat, tempo, samplerate=44100):
        sec = frames / float(samplerate)
        return int(second2tick(sec, ticks_per_beat, tempo))

    def compute_key(self, in_file, out_file, samplerate=44100, win_size=512, hop_size=256):
        """Compute key for a given song.

        :param str in_file: input song, all formats supported by ffmpeg are allowed
        :param str out_file: output temporary midi file that will be deleted as soon as the analysis is over
        :param int samplerate: sampling rate
        :param int win_size: window size
        :param int hop_size: hop size
        """
        downsample = 1
        samplerate = samplerate // downsample
        win_s = win_size // downsample  # fft size
        hop_s = hop_size // downsample  # hop size

        s = aubio.source(in_file, samplerate, hop_s)
        samplerate = s.samplerate
        notes_o = aubio.notes("default", win_s, hop_s, samplerate)
        # convert the track to midi with everything on a single track
        mid = MidiFile()
        track = MidiTrack()
        ticks_per_beat = mid.ticks_per_beat  # default: 480
        bpm = 120  # default midi tempo
        tempo = bpm2tempo(bpm)
        track.append(MetaMessage('set_tempo', tempo=tempo))
        track.append(MetaMessage('time_signature', numerator=4, denominator=4))
        mid.tracks.append(track)
        last_time = 0
        total_frames = 0
        log.info('%s: Computing key...', in_file)
        while True:
            samples, read = s()
            new_note = notes_o(samples)
            if new_note[0] != 0:
                delta = self.frames2tick(total_frames, ticks_per_beat, tempo, samplerate=samplerate) - last_time
                if new_note[2] > 0:
                    track.append(Message('note_off', note=int(new_note[2]), velocity=127, time=delta))
                track.append(Message('note_on', note=int(new_note[0]), velocity=int(new_note[1]), time=delta))
                last_time = self.frames2tick(total_frames, ticks_per_beat, tempo)
            total_frames += read
            if read < hop_s:
                break
        mid.save(out_file)
        score = music21.converter.parse(out_file)
        key = score.analyze('key')
        key.tonic.name = key.tonic.name.replace("-", "")
        key.camelot = self.key_to_camelot(key)
        return key

    def clear_tmp_files(self, song_id, in_file, out_file):
        """Remove temporary files.

        :param str song_id: id of the song
        :param str in_file: downloaded file for analysis
        :param str out_file: midi file generated for analysis
        """
        os.remove(in_file)
        os.remove(out_file)
        log.info('%s: removed files', song_id)

    def download_song_from_storage_server(self, song_id):
        """Download the song to change the pitch from storage server.

        :param str song_id: id of the song to change the pitch
        :return: True if song is downloaded, False otherwise
        :rtype: bool
        """
        result = self.st.download_file(worker_config.STORAGE_BUCKET_REFERENCE, song_id, f'{_tmp_folder}/{_tmp_subfolder}')
        if result:
            os.rename(f'{_tmp_folder}/{_tmp_subfolder}/{song_id}', f'{_tmp_folder}/{_tmp_subfolder}/{song_id}.flac')
        return result

    def remove_pending_song(self, id):
        """Remove the id of the pending song in RabbitMQ queue from database.

        :param str id: id of the song
        """
        self.db.remove_analyzer_pending_song(id)

    def upload_song_data(self, song_id, tempo, key):
        """Upload data of the song analyzed in the database.

        :param str song_id: id of the song changed
        :param float tempo: song estimated BPM
        :param Key key: song key along with camelot translation, confidency and adjacencies
        """
        data = {
            'tempo': tempo,
            'key': {'name': key.tonic.name,
                    'mode': key.mode,
                    'camelot': key.camelot}
        }
        log.info(f'song {song_id} tagged with tempo {tempo}BPM, key {key.tonic.name} {key.mode}')
        self.db.put_song_data_analysis(song_id, data)
