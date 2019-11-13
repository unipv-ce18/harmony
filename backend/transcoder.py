import ffmpy
from database import Queries

class Transcoder:
    def __init__(self, database):
        self.query = Queries(database)

    def transcoding_song(self, id, bitrate='128k', sample_rate=44100, channels=2, extension='.webm'):
        lossless_song = self.query.get_song_from_id(id)
        title = lossless_song['title']
        artist = lossless_song['artist']
        album = lossless_song['album']

        input = f'lossless_songs/{title}.flac'
        output = f'compressed_songs/{title}-{bitrate.replace("k", "")}{extension}'

        metadata_title = f'title="{title}"'
        metadata_artist = f'artist="{artist}"'
        metadata_album = f'album="{album}"'
        m = [metadata_title, metadata_artist, metadata_album]
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

    def transcoding_songs(self, id_list, bitrate='128k', sample_rate=44100, channels=2, extension='.webm'):
        for id in id_list:
            self.transcoding_song(id, bitrate, sample_rate, channels, extension)
