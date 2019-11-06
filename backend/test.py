import json
from pprint import pprint
from db_query import *
import ffmpeg

def read_json(path):
    with open(path, 'r') as f:
        data = f.read()
    json_data = json.loads(data)
    if isinstance(json_data, dict):
        return [json_data]
    return json_data

artists_list = read_json('resources/artists.json')
albums_list = read_json('resources/albums.json')
songs_list = read_json('resources/songs.json')
users_list = read_json('resources/users.json')

add_artists(artists_list)
add_albums(albums_list)
add_songs(songs_list)
add_users(users_list)

#pprint(search_artist('queens'))
#pprint(get_artist_albums('Queens of the Stone Age'))
pprint(get_album_songs('Queens of the Stone Age', 'Queens of the Stone Age'))
#pprint(get_complete_artist('5dbac87a0f70f40bc954c042'))
#pprint(search('queens'))

id_list = [
    '5dbac87a0f70f40bc954c04a',
    '5dbac87a0f70f40bc954c04b',
    '5dbac87a0f70f40bc954c04c'
]

ffmpeg.transcoding_songs(id_list, bitrate='96k')
