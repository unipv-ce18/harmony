from database import *
import json, datetime
import security

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

print(search_artist('queens'))
print(get_artist_albums('Queens of the Stone Age'))
print(get_album_song('Queens of the Stone Age', 'Queens of the Stone Age'))
